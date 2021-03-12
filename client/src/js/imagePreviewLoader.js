function loadImagePreview(file, imgEl){
	if(FileReader && file){
		const fr = new FileReader();

		fr.onload = () => {
			imgEl.src = fr.result;
		};

		fr.readAsDataURL(file);
	}
	else{
		console.error("FileReader is not supported!");
	}
}
