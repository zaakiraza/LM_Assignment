import AssignmentCriteriaModal from "../components/AssignmentCriteriaModal";

function Settings({ criteria, onSave }) {
    return (
        <section className="panel panel-main settings-page">
            <AssignmentCriteriaModal
                criteria={criteria}
                inline
                onClose={() => {}}
                onSave={onSave}
            />
        </section>
    );
}

export default Settings;
