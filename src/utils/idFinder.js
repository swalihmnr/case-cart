import mongoose from "mongoose";

export default async function idFinder(shemaModel, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const objectId = new mongoose.Types.ObjectId(id);
  const existing = await shemaModel.findById(objectId);
  if (existing) {
    return existing;
  } else {
    return null;
  }
}
