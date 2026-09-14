import PendingAssignments from "./PendingAssignments";


function LMAssignment({ refreshKey, criteria, compact, onRequestRefresh }) {

    return (
        <div>
            <PendingAssignments refreshKey={refreshKey} criteria={criteria} compact={compact} onRequestRefresh={onRequestRefresh} />
        </div>
    );
}


export default LMAssignment;