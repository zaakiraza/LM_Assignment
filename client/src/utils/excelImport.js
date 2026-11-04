export const EXCEL_MAX_BYTES = 5 * 1024 * 1024;

/** Canonical column → accepted header aliases (case-insensitive). */
export const REQUIRED_EXCEL_COLUMNS = {
    name: ["name"],
    position: ["position", "designation"],
    experience: ["experience"],
    department: ["department"],
    skills: ["skills"]
};

export const OPTIONAL_EXCEL_COLUMNS = {
    email: ["email"]
};

function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase();
}

function findHeader(headers, aliases) {
    return headers.find((header) => aliases.includes(header)) || null;
}

export function validateExcelFile(file) {
    if (!file) {
        throw new Error("Please choose an Excel file");
    }

    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
        throw new Error("Only .xlsx or .xls files are allowed");
    }

    if (file.size > EXCEL_MAX_BYTES) {
        throw new Error(`Excel file is too large. Maximum size is ${EXCEL_MAX_BYTES / (1024 * 1024)} MB`);
    }
}

export function validateExcelHeaders(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("The Excel file does not contain any employee rows");
    }

    const headers = Object.keys(rows[0] || {}).map(normalizeHeader).filter(Boolean);
    if (!headers.length) {
        throw new Error("The Excel file is missing a header row");
    }

    const missing = Object.entries(REQUIRED_EXCEL_COLUMNS)
        .filter(([, aliases]) => !findHeader(headers, aliases))
        .map(([column]) => column);

    if (missing.length) {
        throw new Error(
            `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. `
            + `Required columns are: ${Object.keys(REQUIRED_EXCEL_COLUMNS).join(", ")}`
        );
    }

    return headers;
}

export function mapExcelRows(rows) {
    validateExcelHeaders(rows);

    return rows.map((row, index) => {
        const lookup = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
        );

        const pick = (aliases) => {
            const key = aliases.find((alias) => lookup[alias] !== undefined && lookup[alias] !== null);
            return key === undefined ? "" : lookup[key];
        };

        const skillsRaw = pick(REQUIRED_EXCEL_COLUMNS.skills);
        const skills = Array.isArray(skillsRaw)
            ? skillsRaw.map((skill) => String(skill).trim()).filter(Boolean)
            : String(skillsRaw || "").split(",").map((skill) => skill.trim()).filter(Boolean);

        return {
            name: String(pick(REQUIRED_EXCEL_COLUMNS.name) || "").trim(),
            email: String(pick(OPTIONAL_EXCEL_COLUMNS.email) || "").trim(),
            position: String(pick(REQUIRED_EXCEL_COLUMNS.position) || "").trim(),
            experience: pick(REQUIRED_EXCEL_COLUMNS.experience),
            department: String(pick(REQUIRED_EXCEL_COLUMNS.department) || "").trim(),
            skills,
            _rowId: `${Date.now()}-${index}`
        };
    });
}
