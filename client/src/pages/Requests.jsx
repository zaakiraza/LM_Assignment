import LMAssignment from "../components/LMAssignment";

function Requests({ criteria, refreshKey, onRequestRefresh }) {
    return (
        <section className="panel panel-main requests-page">
            <LMAssignment criteria={criteria} refreshKey={refreshKey} onRequestRefresh={onRequestRefresh} />
        </section>
    );
}

export default Requests;
