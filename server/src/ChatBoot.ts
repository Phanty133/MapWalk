import { LogisticRegressionClassifier } from "natural";
import path from "path";
import fse from "fs-extra";
import { logger } from "./index";

export default class ChatBoot {
	classifier: LogisticRegressionClassifier;
	testData: any;

	constructor() {
		this.train();
	}

	private async train() {
		const dataDir = path.join(__dirname, "..", "data");
		// logger.info(await fse.readJSON(path.join(dataDir, "testTrainingData.json")));
		this.testData = await fse.readJSON(path.join(dataDir, "testTrainingData.json"));
		this.classifier = new LogisticRegressionClassifier();

		Object.keys(this.testData).forEach((element, key) => {
			this.teach(element, this.testData[element].questions);
		});
		this.classifier.train();
		this.classifier.save(path.join(dataDir, "classifier.json"), () => {
			// nothing
		});
	}

	teach(label: string, phrases: string[]) {
		phrases.forEach((phrase) => {
			this.classifier.addDocument(phrase.toLowerCase(), label);
		});
	}

	interpret(phrase: string) {
		const guesses = this.classifier.getClassifications(phrase.toLowerCase());
		const guess = guesses.reduce((x, y) => x && x.value > y.value ? x : y);
		return {
			probabilities: guesses,
			guess: guess.value > (0.7) ? guess.label : null
		};
	}

	processMessage(text: string): string {
		const interpretation = this.interpret(text);
		if (interpretation.guess && this.testData[interpretation.guess]) {
			return this.testData[interpretation.guess].answer;
		}
		return "no-no";
	}
}