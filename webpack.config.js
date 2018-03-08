const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: {
		index: './server/public/js/main.js',
		bootstrap: 'bootstrap',
		bootstrapcss: 'bootstrap/dist/css/bootstrap.min.css'
	},
	output: {
		path: path.resolve(__dirname, 'server/public/dist'),
		filename: '[name].bundle.js',
		publicPath: '/server/public/dist'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['env']
						}
					}
				]
			},
			{
				test: /\.scss$/,
				use: [
					'css-loader',
					'sass-loader'
				]
			},
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.(png|woff|woff2|eot|ttf|svg)$/,
				loader: 'url-loader?limit=110000'
			}
		]
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery'
		})
	]
};