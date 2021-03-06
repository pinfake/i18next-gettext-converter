var fs = require('fs')
  , path = require('path')
  , chai = require('chai')
  , async = require('async')
  , expect = chai.expect
  , wrapper = require('../lib/gettextWrapper');

var testFiles = {
	en: {
		utf8: './test/_testfiles/en/translation.utf8.po',
		utf8_expected: './test/_testfiles/en/translation.utf8.json',
		latin13: './test/_testfiles/en/translation.latin13.po',
		latin13_expected: './test/_testfiles/en/translation.latin13.json',
		unfiltered: './test/_testfiles/en/translation.unfiltered.po',
		unfiltered_no_comments: './test/_testfiles/en/translation.unfiltered_no_comments.po',
		unfiltered_no_match: './test/_testfiles/en/translation.unfiltered_no_match.po',
		filtered: './test/_testfiles/en/translation.filtered.json',
		filtered_no_comments: './test/_testfiles/en/translation.filtered_no_comments.json',
		empty: './test/_testfiles/en/translation.empty.po',
		missing: './test/_testfiles/en/translation.missing.po',
		bad_format: './test/_testfiles/en/translation.bad_format.po.js'
	},

	de: {
		utf8: './test/_testfiles/de/translation.utf8.po',
		utf8_expected: './test/_testfiles/de/translation.utf8.json'
	},

	ru: {
		utf8: './test/_testfiles/ru/translation.utf8.po',
		utf8_expected: './test/_testfiles/ru/translation.utf8.json'
	}
};


/**
 * Test filter; removes all translations with a code comment that does
 * not include the string '/frontend/'
 *
 * @param gt
 * @param domain
 * @param callback
 * @private
 */
function _filter(gt, domain, callback) {
	var clientSideSource = '/frontend/';
	var err;

	gt.listKeys(domain).forEach(function(key) {
		var comment = gt.getComment(domain, '', key);
		if (comment) {
			if (comment.code && comment.code.indexOf(clientSideSource) === -1) {
				gt.deleteTranslation(domain, '', key);
			}
		}
	});

	callback(err, gt._domains[domain]._translationTable);
}

describe('the gettext wrapper', function() {

	describe('toJSON processing', function() {

		it('should convert a utf8 PO files to JSON', function(done) {
			var tests = [];

			// EN
			tests.push(function(next) {
				var output = './test/_tmp/en.utf8.json';
				wrapper.gettextToI18next('en', testFiles.en.utf8, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					var expected = require(path.join('..', testFiles.en.utf8_expected));
					expect(result).to.deep.equal(expected);
					fs.unlinkSync(output);
					next();
				});
			});

			// DE
			tests.push(function(next) {
				var output = './test/_tmp/de.utf8.json';
				wrapper.gettextToI18next('de', testFiles.de.utf8, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					var expected = require(path.join('..', testFiles.de.utf8_expected));
					expect(result).to.deep.equal(expected);
					fs.unlinkSync(output);
					next();
				});
			});

			// RU
			tests.push(function(next) {
				var output = './test/_tmp/ru.utf8.json';
				wrapper.gettextToI18next('ru', testFiles.ru.utf8, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					var expected = require(path.join('..', testFiles.ru.utf8_expected));
					expect(result).to.deep.equal(expected);
					fs.unlinkSync(output);
					next();
				});
			});

			async.series(tests, done);
		});

		it('should convert a latin13 PO files to JSON, for a given domain', function(next) {
			var output = './test/_tmp/en.latin13.json';

			// EN
			wrapper.gettextToI18next('en', testFiles.en.latin13, output, {quiet: true}, function(){
				var result = require(path.join('..', output));
				var expected = require(path.join('..', testFiles.en.latin13_expected));
				expect(result).to.deep.equal(expected);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should filter incoming PO translations if a filter function is passed to options', function(next) {
			var output = './test/_tmp/translation.filtered.json';

			var options = {
				quiet: true,
				filter: _filter
			};

			// Should filter all but the col* keys
			wrapper.gettextToI18next('en', testFiles.en.unfiltered, output, options, function(){
				var result = require(path.join('..', output));
				var expected = require(path.join('..', testFiles.en.filtered));
				expect(result).to.deep.equal(expected);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should pass all keys unfiltered, when the PO has no comments', function(next) {
			var output = './test/_tmp/translation.nocomments.json';

			var options = {
				quiet: true,
				filter: _filter
			};

			// Should filter none of the keys
			wrapper.gettextToI18next('en', testFiles.en.unfiltered_no_comments, output, options, function(){
				var result = require(path.join('..', output));
				var expected = require(path.join('..', testFiles.en.filtered_no_comments));
				expect(result).to.deep.equal(expected);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should return an empty JSON file if nothing matches the given filter', function(next) {
			var output = './test/_tmp/translation.nomatch.json';

			var options = {
				quiet: true,
				filter: _filter
			};

			// Should filter all the keys
			wrapper.gettextToI18next('en', testFiles.en.unfiltered_no_match, output, options, function(){
				var result = require(path.join('..', output));
				expect(result).to.deep.equal({});
				fs.unlinkSync(output);
				next();
			});
		});

		// -- Error States & Invalid Data --

		describe('error states', function() {

			it('should output an empty JSON file if the given PO does not exist', function(next) {
				var output = './test/_tmp/translation.missing.json';

				wrapper.gettextToI18next('en', testFiles.en.missing, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					expect(result).to.deep.equal({});
					fs.unlinkSync(output);
					next();
				});
			});

			it('should output an empty JSON file if the given PO exists but is empty', function(next) {
				var output = './test/_tmp/translation.empty.json';

				wrapper.gettextToI18next('en', testFiles.en.empty, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					expect(result).to.deep.equal({});

					fs.unlinkSync(output);
					next();
				});
			});

			it('should output an empty JSON file if passed something other than a PO', function(next) {
				var output = './test/_tmp/translation.bad_format.json';

				wrapper.gettextToI18next('en', testFiles.en.bad_format, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					expect(result).to.deep.equal({});

					fs.unlinkSync(output);
					next();
				});
			});
		});
	});
});
