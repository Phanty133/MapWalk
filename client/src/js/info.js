const statusMessages = {
	200: "All's good m8",
	400: "Something went wrong. Check inputs and try again.",
	404: "Failed to send request. Check your internet connection and try again.",
	500: "Something went wrong. Please try again later."
}

const otherMessages = {
	"fetchFail": "Something went wrong. Please try again. %s",
	"passwordIncorrect": "Password incorrect!",
	"passwordsDontMatch": "Passwords don't match!",
	"usernameExists": "A user with that username already exists!"
}

function showResponseInfo(res){
	document.getElementById("info").textContent = `${res.statusText}. ${statusMessages[res.status]}`;
}

function showOtherInfo(type, ...other){
	let msg = otherMessages[type];

	for(const arg of other){
		msg = msg.replace("%s", arg);
	}

	document.getElementById("info").textContent = msg;
}
