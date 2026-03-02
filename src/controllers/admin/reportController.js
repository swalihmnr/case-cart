import { STATUS_CODES } from "../../utils/statusCodes.js";
import Order from "../../models/orderModel.js";
import moment from "moment";
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';

const buildMatchStage = (query) => {
    const { dateRange = 'this-month', status = 'all', startDate, endDate } = query;
    const matchStage = {};

    if (dateRange !== 'all') {
        let start, end;
        const now = moment();

        if (dateRange === 'today') {
            start = now.startOf('day').toDate();
            end = moment().endOf('day').toDate();
        } else if (dateRange === 'this-week') {
            start = now.startOf('isoWeek').toDate();
            end = moment().endOf('isoWeek').toDate();
        } else if (dateRange === 'this-month') {
            start = now.startOf('month').toDate();
            end = moment().endOf('month').toDate();
        } else if (dateRange === 'this-year') {
            start = now.startOf('year').toDate();
            end = moment().endOf('year').toDate();
        } else if (dateRange === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();
        }

        if (start && end) {
            matchStage.createdAt = { $gte: start, $lte: end };
        }
    }

    if (status !== 'all') {
        matchStage['orderItems.status'] = status;
    }

    return matchStage;
};

const getReport = async (req, res) => {
    try {
        const { dateRange = 'this-month', status = 'all', page = 1, startDate, endDate } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;

        const matchStage = buildMatchStage(req.query);

        // Better summary aggregation for order-level and item-level
        const orderSummary = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalSales: {
                        $sum: {
                            $cond: [
                                { $in: [{ $arrayElemAt: ["$orderItems.status", 0] }, ["cancelled", "returned"]] },
                                0,
                                "$finalAmount"
                            ]
                        }
                    },
                    totalRefunds: {
                        $sum: {
                            $cond: [
                                { $in: [{ $arrayElemAt: ["$orderItems.status", 0] }, ["cancelled", "returned"]] },
                                "$finalAmount",
                                0
                            ]
                        }
                    },
                    orderCount: { $sum: 1 },
                    totalDiscount: { $sum: "$totalDiscount" },
                    totalCouponDiscount: { $sum: "$couponDiscount" },
                }
            }
        ]);

        const summary = orderSummary[0] || { totalSales: 0, totalRefunds: 0, orderCount: 0, totalDiscount: 0, totalCouponDiscount: 0 };
        const avgOrderValue = summary.orderCount > 0 ? summary.totalSales / summary.orderCount : 0;

        // Fetch Paginated Orders
        const orders = await Order.find(matchStage)
            .populate("userId", "firstName lastName email")
            .populate("orderItems.productId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalOrderRecords = await Order.countDocuments(matchStage);
        const totalPages = Math.ceil(totalOrderRecords / limit);

        let dateGroupFormat = "%Y-%m-%d";
        if (dateRange === 'this-year' || dateRange === 'all') {
            dateGroupFormat = "%Y-%m";
        }

        const chartAgg = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: dateGroupFormat, date: "$createdAt" } },
                    revenue: { $sum: "$finalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const chartData = {
            labels: chartAgg.map(item => item._id),
            revenue: chartAgg.map(item => item.revenue),
            count: chartAgg.map(item => item.count)
        };

        return res.status(STATUS_CODES.OK).render('./admin/sale-report', {
            orders,
            summary,
            avgOrderValue,
            currentPage: parseInt(page),
            totalPages,
            filters: { dateRange, status, startDate, endDate },
            chartData: JSON.stringify(chartData)
        });
    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error!'
        });
    }
}

const exportPdf = async (req, res) => {
    try {
        const matchStage = buildMatchStage(req.query);
        const orders = await Order.find(matchStage)
            .populate("userId", "firstName lastName email")
            .populate("orderItems.productId", "name")
            .sort({ createdAt: -1 })
            .lean();

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
        doc.pipe(res);

        doc.fontSize(20).text('CaseCart - Sales Report', { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
        doc.moveDown(2);

        const tableArray = {
            headers: ["Order ID", "Date", "Customer", "Items", "Amount(Rs)", "Discount", "Payment", "Status"],
            rows: orders.map(order => {
                let status = 'Unknown';
                if (order.orderItems && order.orderItems.length > 0) {
                    status = order.orderItems[0].status;
                }
                const totalRowDiscount = (order.totalDiscount || 0) + (order.couponDiscount || 0);

                return [
                    order.orderId || order._id.toString().slice(-6),
                    moment(order.createdAt).format('YYYY-MM-DD'),
                    order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : 'Unknown',
                    order.orderItems ? order.orderItems.map(item => item.productId ? item.productId.name : 'Unknown').join(", ") : 'No Items',
                    (order.finalAmount || 0).toFixed(2),
                    totalRowDiscount.toFixed(2),
                    order.paymentMethod || 'N/A',
                    status
                ];
            })
        };

        await doc.table(tableArray, {
            width: 535,
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(9)
        });

        // Calculate totals for summary
        let totalSales = 0;
        let totalRefunds = 0;
        let totalDiscount = 0;
        orders.forEach(o => {
            const status = o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].status : 'unknown';
            if (['cancelled', 'returned'].includes(status)) {
                totalRefunds += (o.finalAmount || 0);
            } else {
                totalSales += (o.finalAmount || 0);
            }
            totalDiscount += (o.totalDiscount || 0) + (o.couponDiscount || 0);
        });

        doc.moveDown(2);
        doc.fontSize(14).text('Summary:');
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Total Orders: ${orders.length}`);
        doc.text(`Successful Sales: Rs ${totalSales.toFixed(2)}`);
        doc.text(`Refund Amount: Rs ${totalRefunds.toFixed(2)}`);
        doc.text(`Total Discount Given: Rs ${totalDiscount.toFixed(2)}`);

        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        if (!res.headersSent) {
            res.status(500).send("Error generating PDF report");
        }
    }
};

const exportExcel = async (req, res) => {
    try {
        const matchStage = buildMatchStage(req.query);
        const orders = await Order.find(matchStage)
            .populate("userId", "firstName lastName email")
            .populate("orderItems.productId", "name")
            .sort({ createdAt: -1 })
            .lean();

        console.log("DEBUG exportExcel req.query:", req.query);
        console.log("DEBUG exportExcel matchStage:", matchStage);
        console.log("DEBUG exportExcel orders.length:", orders.length);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales Report');

        sheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 22 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Customer Name', key: 'customer', width: 25 },
            { header: 'Products', key: 'items', width: 35 },
            { header: 'Total Amount', key: 'amount', width: 18 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Payment Method', key: 'payment', width: 20 },
            { header: 'Order Status', key: 'status', width: 18 }
        ];

        // Format Header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        let totalSales = 0;
        let totalRefunds = 0;
        let totalDiscount = 0;

        orders.forEach(order => {
            let status = 'Unknown';
            if (order.orderItems && order.orderItems.length > 0) {
                status = order.orderItems[0].status;
            }
            const totalRowDiscount = (order.totalDiscount || 0) + (order.couponDiscount || 0);

            if (['cancelled', 'returned'].includes(status)) {
                totalRefunds += (order.finalAmount || 0);
            } else {
                totalSales += (order.finalAmount || 0);
            }
            totalDiscount += totalRowDiscount;

            const row = sheet.addRow({
                orderId: order.orderId || order._id.toString().slice(-6),
                date: moment(order.createdAt).format('YYYY-MM-DD'),
                customer: order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : 'Unknown',
                items: order.orderItems ? order.orderItems.map(item => item.productId ? item.productId.name : 'Unknown').join(", ") : 'No Items',
                amount: (order.finalAmount || 0).toFixed(2),
                discount: totalRowDiscount.toFixed(2),
                payment: order.paymentMethod || 'N/A',
                status: status
            });

            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });
        });

        // Adding summary properly formatted
        sheet.addRow([]); // Blank row
        const sumRow1 = sheet.addRow([null, null, null, 'Total Orders:', orders.length]);
        const sumRow2 = sheet.addRow([null, null, null, 'Total Successful Sales (Rs):', totalSales.toFixed(2)]);
        const sumRow3 = sheet.addRow([null, null, null, 'Total Refund Amount (Rs):', totalRefunds.toFixed(2)]);
        const sumRow4 = sheet.addRow([null, null, null, 'Total Discount (Rs):', totalDiscount.toFixed(2)]);

        [sumRow1, sumRow2, sumRow3, sumRow4].forEach(row => {
            row.getCell(4).font = { bold: true };
            row.getCell(4).alignment = { horizontal: 'right' };
            row.getCell(5).font = { bold: true, color: { argb: 'FF000000' } };
            row.getCell(5).alignment = { horizontal: 'left' };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel:", error);
        res.status(500).send("Error generating Excel report");
    }
};

export default {
    getReport,
    exportPdf,
    exportExcel
};
