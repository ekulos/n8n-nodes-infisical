const { src, dest } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{png,svg}')
		.pipe(dest('dist/nodes'));
}

function buildCredentialIcons() {
	return src('credentials/**/*.{png,svg}')
		.pipe(dest('dist/credentials'));
}

exports['build:icons'] = buildIcons;
exports['build:credential:icons'] = buildCredentialIcons;
exports.default = buildIcons;