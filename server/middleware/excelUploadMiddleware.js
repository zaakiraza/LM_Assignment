import multer from "multer";
import { EXCEL_MAX_BYTES } from "../utils/excelImport.js";
import responseHandler from "../utils/responseHandler.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: EXCEL_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
        const name = (file.originalname || "").toLowerCase();
        const allowed = name.endsWith(".xlsx") || name.endsWith(".xls")
            || file.mimetype?.includes("spreadsheet")
            || file.mimetype === "application/vnd.ms-excel";

        if (!allowed) {
            return cb(new Error("Only .xlsx or .xls files are allowed"));
        }
        return cb(null, true);
    }
});

const excelUpload = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return responseHandler.error(
                    res,
                    `Excel file is too large. Maximum size is ${EXCEL_MAX_BYTES / (1024 * 1024)} MB`,
                    400
                );
            }
            return responseHandler.error(res, error.message || "File upload failed", 400);
        }

        return responseHandler.error(res, error.message || "File upload failed", 400);
    });
};

export default excelUpload;
