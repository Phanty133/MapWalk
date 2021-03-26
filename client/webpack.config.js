const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const outputPath = path.resolve(__dirname, "client");

module.exports = {
	mode: "development",
	entry: {
		modeSelect: {
			import: path.resolve(__dirname, "src", "modeSelectEntry.ts"),
			dependOn: "shared"
		},
		game: {
			import: path.resolve(__dirname, "src", "index.ts"),
			dependOn: "shared"
		},
		shared: ["leaflet", "js-cookie"]
	},
	output: {
		filename: "[name].bundle.js",
		path: outputPath,
		clean: true
	},
	plugins: [
		new HtmlWebpackPlugin({
			hash: true,
			template: path.resolve(__dirname, "src", "html", "game.ejs"),
			filename: path.resolve(outputPath, "game.html"),
			chunks: ["game", "shared"]
		}),
		new HtmlWebpackPlugin({
			hash: true,
			template: path.resolve(__dirname, "src", "html", "modeSelect.ejs"),
			filename: path.resolve(outputPath, "index.html"),
			chunks: ["modeSelect", "shared"]
		}),
		new MiniCssExtractPlugin()
	],
	devtool: "inline-source-map",
	experiments: {
		asyncWebAssembly: true
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [ MiniCssExtractPlugin.loader, "css-loader"]
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
				test: /\.tsx?$/i,
				use: "ts-loader",
				exclude: /node-modules/
			},
			{
				test: /\.(c|cpp)$/i,
				use: {
					loader: "cpp-wasm-loader",
					options: {
						// emccFlags: (existingFlags) => existingFlags.concat(["-sERROR_ON_UNDEFINED_SYMBOLS=0"])
					}
				}
			}
		]
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".cpp", ".c"],
		alias: {
			css: path.resolve(__dirname, "src", "css"),
			ts: path.resolve(__dirname, "src", "ts"),
			fonts: path.resolve(__dirname, "src", "fonts"),
			img: path.resolve(__dirname, "src", "img"),
			js: path.resolve(__dirname, "src", "js"),
			cpp: path.resolve(__dirname, "src", "cpp"),
			c: path.resolve(__dirname, "src", "c")
		}
	}
};