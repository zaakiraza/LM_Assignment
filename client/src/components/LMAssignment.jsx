import PendingAssignments from "./PendingAssignments";


function LMAssignment({ refreshKey, onRequestRefresh }) {

    return (
        <div>
            <PendingAssignments refreshKey={refreshKey} onRequestRefresh={onRequestRefresh} />
        </div>
    );
}


export default LMAssignment;