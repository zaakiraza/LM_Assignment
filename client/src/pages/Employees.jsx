import { useState } from "react";
import EmployeeList from "../components/EmployeeList";
import AddEmployees from "./AddEmployees";
import { useAuth } from "../context/AuthContext";

function Employees({ criteria, refreshKey, onRequestRefresh }) {
    const auth = useAuth();
    const [showAdd, setShowAdd] = useState(false);
    const [importRows, setImportRows] = useState([]);

    return (
        <section className="panel panel-main employees-page">
            <EmployeeList
                criteria={criteria}
                refreshKey={refreshKey}
                onRequestRefresh={onRequestRefresh}
                canAddEmployees={auth.isHR && importRows.length === 0}
                onAddEmployees={() => setShowAdd(true)}
                importRows={importRows}
                onImportRowsChange={setImportRows}
            />

            {showAdd && auth.isHR && (
                <AddEmployees
                    asModal
                    onChanged={() => {
                        onRequestRefresh?.();
                    }}
                    onClose={() => setShowAdd(false)}
                    onExcelReady={(rows) => {
                        setImportRows(rows);
                        setShowAdd(false);
                    }}
                />
            )}
        </section>
    );
}

export default Employees;
