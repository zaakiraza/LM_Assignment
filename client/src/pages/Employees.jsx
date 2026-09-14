import EmployeeList from "../components/EmployeeList";

function Employees({ criteria, refreshKey, onRequestRefresh }) {
    return (
        <section className="panel panel-main">
            <EmployeeList criteria={criteria} refreshKey={refreshKey} onRequestRefresh={onRequestRefresh} />
        </section>
    );
}

export default Employees;
