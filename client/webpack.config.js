const path = require("path");

module.exports = {
	mode: "development",
	entry: "./src/index.ts",
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "client")
	},
	devtool: "inline-source-map",
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"]
			},
			{
				test: /.(png|svg|jpg|jpeg|gif)$/i,
				type: "asset/resource"
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: "asset/resource"
			},
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node-modules/
			}
		]
	},
	resolve: {
		extensions: [".ts", ".tsx"]
	}
};