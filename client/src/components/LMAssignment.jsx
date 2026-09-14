import PendingAssignments from "./PendingAssignments";


function LMAssignment({ refreshKey, criteria, onRequestRefresh }) {

    return (
        <div>
            <PendingAssignments refreshKey={refreshKey} criteria={criteria} onRequestRefresh={onRequestRefresh} />
        </div>
    );
}


export default LMAssignment;