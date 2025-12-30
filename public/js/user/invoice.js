 window.invoicePrint = function () {
            window.print();
        };
        
        // Download PDF function optimized for A4
        window.invoiceDownload = function () {
            const element = document.getElementById("invoice-container");
            if (!element) return;
            
            // Optimize for A4 PDF generation
            html2pdf()
                .set({
                    margin: [15, 15, 15, 15], // 15mm margins on all sides
                    filename: "Invoice_#<%= order.orderId %>.pdf",
                    image: { 
                        type: "jpeg", 
                        quality: 0.98 
                    },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        width: 210 * 3.78, // Convert mm to pixels (210mm * 3.78px/mm)
                        windowWidth: 210 * 3.78
                    },
                    jsPDF: { 
                        unit: "mm", 
                        format: "a4", 
                        orientation: "portrait" 
                    }
                })
                .from(element)
                .save()
                .then(() => {
                    // Optional: Redirect after download
                    // window.location.href = "/order";
                })
                .catch(error => {
                    console.error("PDF generation failed:", error);
                    alert("Failed to generate PDF. Please try printing instead.");
                });
        };