'use strict';
'require fs';
'require ui';

return L.view.extend({
	tailDefault: 25,

	getLogData: function(tail) {
		return Promise.all([
			L.resolveDefault(fs.stat('/sbin/logread'), null),
			L.resolveDefault(fs.stat('/usr/sbin/logread'), null),
		]).then(stat => {
			let logger = (stat[0]) ? stat[0].path : (stat[1]) ? stat[1].path : null;

			if(logger) {
				let loggerArgs = (tail) ? [ '-l', tail, '-e', '^' ] : [ '-e', '^' ];

				return fs.exec_direct(logger, loggerArgs).catch(err => {
					ui.addNotification(null, E('p', {}, _('Unable to load log data:') + ' ' + err.message));
					return '';
				});
			};
		});
	},

	parseLogData: function(logdata) {
		return logdata.trim().split(/\n/);
	},

	setLogFilter: function(cArr) {
		let fPattern = document.getElementById('logFilter').value;
		if(!fPattern) {
			return cArr;
		};
		let fArr = [];
		try {
			fArr = cArr.filter(s => new RegExp(fPattern, 'iu').test(s));
		} catch(err) {
			if(err.name === 'SyntaxError') {
				ui.addNotification(null,
					E('p', {}, _('Wrong regular expression') + ': ' + err.message));
				return cArr;
			} else {
				throw err;
			};
		};
		if(fArr.length === 0) {
			fArr.push(_('No matches...'));
		};
		return fArr;
	},

	load: function() {
		return this.getLogData(this.tailDefault);
	},

	render: function(logdata) {
		let navBtnsTop = '1px';

		let logTextarea = E('textarea', {
			'id': 'syslog',
			'class': 'cbi-input-textarea',
			'style': 'width:100% !important; resize:horizontal; padding: 0 0 0 45px; font-size:12px',
			'readonly': 'readonly',
			'wrap': 'off',
			'rows': this.tailDefault,
			'spellcheck': 'false',
		}, [ logdata.trim() ]);

		let tailValue = E('input', {
			'id': 'tailValue',
			'name': 'tailValue',
			'type': 'text',
			'form': 'logForm',
			'class': 'cbi-input-text',
			'style': 'width:4em !important; min-width:4em !important; margin-bottom:0.3em !important',
			'maxlength': 5,
		});
		tailValue.value = this.tailDefault;
		ui.addValidator(tailValue, 'uinteger', true);

		let logFilter = E('input', {
			'id': 'logFilter',
			'name': 'logFilter',
			'type': 'text',
			'form': 'logForm',
			'class': 'cbi-input-text',
			'style': 'min-width:16em !important; margin-right:1em !important; margin-bottom:0.3em !important',
			'placeholder': _('Entries filter'),
			'data-tooltip': _('Filter entries using regexp'),
		});

		let logFormSubmitBtn = E('input', {
			'type': 'submit',
			'form': 'logForm',
			'class': 'cbi-button btn cbi-button-action',
			'style': 'margin-right:1em !important; margin-bottom:0.3em !important;',
			'value': _('Apply'),
			'click': ev => ev.target.blur(),
		});

		return E([
			E('h2', { 'id': 'logTitle', 'class': 'fade-in' }, _('System Log')),
			E('div', { 'class': 'cbi-section-descr fade-in' }),
			E('div', { 'class': 'cbi-section fade-in' },
				E('div', { 'class': 'cbi-section-node' },
					E('div', { 'id': 'contentSyslog', 'class': 'cbi-value' }, [
						E('label', {
							'class': 'cbi-value-title',
							'for': 'tailValue',
							'style': 'margin-bottom:0.3em !important',
						}, _('Show only the last entries')),
						E('div', { 'class': 'cbi-value-field' }, [
							tailValue,
							E('input', {
								'type': 'button',
								'form': 'logForm',
								'class': 'cbi-button btn cbi-button-reset',
								'value': 'Χ',
								'click': ev => {
									tailValue.value = null;
									logFormSubmitBtn.click();
									ev.target.blur();
								},
								'style': 'margin-right:1em !important; margin-bottom:0.3em !important; max-width:4em !important',
							}),
							logFilter,
							logFormSubmitBtn,
							E('form', {
								'id': 'logForm',
								'name': 'logForm',
								'style': 'display:inline-block; margin-bottom:0.3em !important',
								'submit': ui.createHandlerFn(this, function(ev) {
									ev.preventDefault();
									let formElems = Array.from(document.forms.logForm.elements);
									formElems.forEach(e => e.disabled = true);

									return this.getLogData(
										(tailValue.value && tailValue.value > 0) ? tailValue.value : 0
									).then(logdata => {
										let loglines = this.setLogFilter(this.parseLogData(logdata));
										logTextarea.rows = (loglines.length < this.tailDefault) ?
											this.tailDefault : loglines.length;
										logTextarea.value = loglines.join('\n');
									}).finally(() => {
										formElems.forEach(e => e.disabled = false);
									});
								}),
							}, E('span', {}, '&#160;')),
						]),
					])
				)
			),
			E('div', { 'class': 'cbi-section fade-in' },
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'style': 'position:fixed' }, [
						E('button', {
							'class': 'btn',
							'style': 'position:relative; display:block; margin:0 !important; left:1px; top:'
								+ navBtnsTop,
							'click': ev => {
								document.getElementById('logTitle').scrollIntoView(true);
								ev.target.blur();
							},
						}, '&#8593;'),
						E('button', {
							'class': 'btn',
							'style': 'position:relative; display:block; margin:0 !important; margin-top:1px !important; left:1px; top:'
								+ navBtnsTop,
							'click': ev => {
								logTextarea.scrollIntoView(false);
								ev.target.blur();
							},
						}, '&#8595;'),
					]),
					logTextarea,
				])
			),
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
});

