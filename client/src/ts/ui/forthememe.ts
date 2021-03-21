export default function randomizeActionButtons(){
	const switchChildren: boolean = Math.random() >= 0.5;
	const parent = document.getElementById("mapButtons");

	if(switchChildren){
		parent.insertBefore(parent.children[1], parent.children[0]);
	}
}
