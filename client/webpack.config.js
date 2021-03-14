const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const outputPath = path.resolve(__dirname, "client");

module.exports = {
	mode: "development",
	entry: path.resolve(__dirname, "src", "index.ts"),
	output: {
		filename: "bundle.js",
		path: outputPath,
		clean: true
	},
	plugins: [
		new HtmlWebpackPlugin({
			hash: true,
			template: path.resolve(__dirname, "src", "html", "index.ejs"),
			filename: path.resolve(outputPath, "index.html")
		})
	],
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
		extensions: [".ts", ".tsx", ".js"],
		alias: {
			css: path.resolve(__dirname, "src", "css"),
			ts: path.resolve(__dirname, "src", "ts"),
			fonts: path.resolve(__dirname, "src", "fonts"),
			img: path.resolve(__dirname, "src", "img")
		}
	}
};