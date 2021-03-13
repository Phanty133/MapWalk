function loadImagePreview(file: File, imgEl: HTMLImageElement){
	if(FileReader && file){
		const fr = new FileReader();

		fr.onload = () => {
			imgEl.src = fr.result.toString();
		};

		fr.readAsDataURL(file);
	}
	else{
		console.error("FileReader is not supported!");
	}
}
