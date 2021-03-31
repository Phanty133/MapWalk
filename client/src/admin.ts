import "css/adminpanel.css"
import ObjectEditor from "ts/admin/ObjectEditor"
import Log from "ts/lib/log";

document.body.onload = () => {
	Log.log("afafas");
	const objEditor = new ObjectEditor(document.getElementById("objectEditorContainer"));
};
