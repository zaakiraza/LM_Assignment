export function serializeEmployee(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
    return {
        id: String(obj._id),
        name: obj.name,
        email: obj.email || null,
        googleId: obj.googleId || null,
        avatar: obj.avatar || "",
        isVerified: Boolean(obj.isVerified),
        position: obj.position || null,
        experience: obj.experience ?? 0,
        department: obj.department || "Unassigned",
        skills: Array.isArray(obj.skills) ? obj.skills : [],
        employeeManaged: obj.employeeManaged ?? 0
    };
}

export function serializeAssignment(doc, extras = {}) {
    if (!doc) return null;
    const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
    return {
        assignmentId: String(obj._id),
        assignedEmpId: obj.assignedEmpId ? String(obj.assignedEmpId._id || obj.assignedEmpId) : null,
        lineManagerId: obj.lineManagerId ? String(obj.lineManagerId._id || obj.lineManagerId) : null,
        isConfirm: obj.isConfirm ? 1 : 0,
        isActive: obj.isActive ? 1 : 0,
        ...extras
    };
}
