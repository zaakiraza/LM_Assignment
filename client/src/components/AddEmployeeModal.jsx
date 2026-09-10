import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import EmployeeService from "../services/employeeService";

const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    designation: Yup.string().required("Designation is required"),
    experience: Yup.number().min(0, "Experience cannot be negative").required("Experience is required"),
    department: Yup.string().required("Department is required"),
    skills: Yup.string().required("Skills are required")
});

function AddEmployeeModal({ onClose, onAdded }) {
    const initialValues = {
        name: "",
        designation: "",
        experience: "",
        department: "",
        skills: ""
    };

    const handleSubmit = async (values, { setSubmitting, setStatus }) => {
        try {
            const employee = {
                id: Date.now(),
                name: values.name,
                designation: values.designation,
                experience: Number(values.experience),
                department: values.department,
                skills: values.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
                employeeManaged: 0
            };

            await EmployeeService.createEmployee(employee);
            onAdded();
            onClose();
        }
        catch (error) {
            console.error(error);
            setStatus(
                error.response?.data?.message ||
                "Failed to create employee"
            );
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

                    <button
                        type="button"
                        className="icon-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, status }) => (
                        <Form className="modal-form">
                            <label>Name</label>
                            <Field
                                name="name"
                                type="text"
                                placeholder="Enter name"
                                className="modal-input"
                            />
                            <ErrorMessage
                                name="name"
                                component="p"
                                className="modal-message error"
                            />


                            <label>Designation</label>
                            <Field
                                as="select"
                                name="designation"
                                className="modal-input"
                            >
                                <option value="">Select designation</option>
                                <option>Software Architect</option>
                                <option>Lead Software Engineer</option>
                                <option>Senior Software Engineer</option>
                                <option>Software Engineer</option>
                            </Field>
                            <ErrorMessage
                                name="designation"
                                component="p"
                                className="modal-message error"
                            />


                            <label>Experience</label>
                            <Field
                                name="experience"
                                type="number"
                                min="0"
                                placeholder="Years"
                                className="modal-input"
                            />
                            <ErrorMessage
                                name="experience"
                                component="p"
                                className="modal-message error"
                            />


                            <label>Department</label>
                            <Field
                                as="select"
                                name="department"
                                className="modal-input"
                            >
                                <option value="">Select department</option>
                                <option value="netSuite">netSuite</option>
                                <option value="App dev">App dev</option>
                                <option value="IT">IT</option>
                            </Field>
                            <ErrorMessage
                                name="department"
                                component="p"
                                className="modal-message error"
                            />

                            <label>Skills</label>
                            <Field
                                name="skills"
                                type="text"
                                placeholder="React, Node.js, TypeScript"
                                className="modal-input"
                            />
                            <ErrorMessage
                                name="skills"
                                component="p"
                                className="modal-message error"
                            />

                            {status && (
                                <p className="modal-message error">{status}</p>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={
                                        isSubmitting
                                    }
                                >
                                    {isSubmitting
                                        ? "Adding..."
                                        : "Add Employee"}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}


export default AddEmployeeModal;