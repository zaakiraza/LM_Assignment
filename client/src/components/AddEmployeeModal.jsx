import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import EmployeeService from "../services/employeeService";
import { POSITIONS } from "../config/positions";

const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Enter a valid email").required("Email is required"),
    position: Yup.string().required("Position is required"),
    experience: Yup.number().min(0, "Experience cannot be negative").required("Experience is required"),
    department: Yup.string().required("Department is required"),
    skills: Yup.array().of(Yup.string()).min(1, "Add at least one skill")
});

function AddEmployeeModal({ onClose, onAdded }) {
    const initialValues = {
        name: "",
        email: "",
        position: "",
        experience: "",
        department: "",
        skills: [],
        skillDraft: ""
    };

    const handleSubmit = async (values, { setSubmitting, setStatus }) => {
        try {
            const employee = {
                name: values.name,
                email: values.email,
                position: values.position,
                experience: Number(values.experience),
                department: values.department,
                skills: values.skills,
                employeeManaged: 0,
                isVerified: true
            };

            await EmployeeService.createEmployee(employee);
            onAdded();
            onClose();
        }
        catch (error) {
            console.error(error);
            setStatus(error.response?.data?.message || "Failed to create employee");
        }
        finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Employee</p>
                        <h2>Add Employee</h2>
                    </div>
                    <button type="button" className="icon-close" onClick={onClose}>×</button>
                </div>

                <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                    {({ isSubmitting, status, values, setFieldValue, setFieldTouched }) => {
                        const addSkill = () => {
                            const skill = values.skillDraft.trim();
                            if (!skill) return;
                            if (values.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
                                setFieldValue("skillDraft", "");
                                return;
                            }
                            setFieldValue("skills", [...values.skills, skill]);
                            setFieldValue("skillDraft", "");
                            setFieldTouched("skills", true, false);
                        };

                        const removeSkill = (skill) => {
                            setFieldValue(
                                "skills",
                                values.skills.filter((item) => item !== skill)
                            );
                            setFieldTouched("skills", true, false);
                        };

                        return (
                            <Form className="modal-form">
                                <label>Name</label>
                                <Field name="name" type="text" placeholder="Enter name" className="modal-input" />
                                <ErrorMessage name="name" component="p" className="modal-message error" />

                                <label>Email</label>
                                <Field name="email" type="email" placeholder="name@company.com" className="modal-input" />
                                <ErrorMessage name="email" component="p" className="modal-message error" />

                                <label>Position</label>
                                <Field as="select" name="position" className="modal-input">
                                    <option value="">Select position</option>
                                    {POSITIONS.map((position) => (
                                        <option key={position} value={position}>{position}</option>
                                    ))}
                                </Field>
                                <ErrorMessage name="position" component="p" className="modal-message error" />

                                <label>Experience</label>
                                <Field name="experience" type="number" min="0" placeholder="Years" className="modal-input" />
                                <ErrorMessage name="experience" component="p" className="modal-message error" />

                                <label>Department</label>
                                <Field as="select" name="department" className="modal-input">
                                    <option value="">Select department</option>
                                    <option value="netSuite">netSuite</option>
                                    <option value="App dev">App dev</option>
                                    <option value="IT">IT</option>
                                    <option value="HR">HR</option>
                                </Field>
                                <ErrorMessage name="department" component="p" className="modal-message error" />

                                <label>Skills</label>
                                {values.skills.length > 0 && (
                                    <div className="skill-tags">
                                        {values.skills.map((skill) => (
                                            <span key={skill} className="skill-tag">
                                                {skill}
                                                <button
                                                    type="button"
                                                    className="skill-tag-remove"
                                                    aria-label={`Remove ${skill}`}
                                                    onClick={() => removeSkill(skill)}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <Field
                                    name="skillDraft"
                                    type="text"
                                    className="modal-input"
                                    placeholder="Type a skill and press Enter"
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addSkill();
                                        }
                                    }}
                                />
                                <ErrorMessage name="skills" component="p" className="modal-message error" />

                                {status && <p className="modal-message error">{status}</p>}

                                <div className="modal-actions">
                                    <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                                    <button type="submit" className="primary-btn" disabled={isSubmitting}>
                                        {isSubmitting ? "Adding..." : "Add Employee"}
                                    </button>
                                </div>
                            </Form>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
}

export default AddEmployeeModal;
