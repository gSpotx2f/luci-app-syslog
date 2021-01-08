'use strict';
'require fs';
'require ui';

return L.view.extend({
	tailDefault: 25,
	patternDefault: '^',

	getLogData: function(last, pattern) {
		return Promise.all([
			L.resolveDefault(fs.stat('/sbin/logread'), null),
			L.resolveDefault(fs.stat('/usr/sbin/logread'), null),
		]).then(stat => {
			let logger = (stat[0]) ? stat[0].path : (stat[1]) ? stat[1].path : null;

			if(logger) {
				return fs.exec_direct(logger, [ '-l', last, '-e', pattern ]).catch(err => {
					ui.addNotification(null, E('p', {}, _('Unable to load log data: ' + err.message)));
					return '';
				});
			};
		});
	},

	load: function() {
		return this.getLogData(this.tailDefault, this.patternDefault);
	},

	render: function(logdata) {
		let navBtnsTop = '120px';

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
			'style': 'width:4em !important; min-width:4em !important',
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
			'style': 'margin-left:1em !important; width:16em !important; min-width:16em !important',
			'placeholder': _('Message filter'),
			'data-tooltip': _('Filter messages with a regexp'),
		});

		let logFormSubmitBtn = E('input', {
			'type': 'submit',
			'form': 'logForm',
			'class': 'cbi-button btn',
			'style': 'margin-left:1em !important; vertical-align:middle',
			'value': _('Apply'),
			'click': ev => ev.target.blur(),
		});

		return E([
			E('h2', { 'id': 'logTitle', 'class': 'fade-in' }, _('System Log')),
			E('div', { 'class': 'cbi-section-descr fade-in' }),
			E('div', { 'class': 'cbi-section fade-in' },
				E('div', { 'class': 'cbi-section-node' },
					E('div', { 'id': 'contentSyslog', 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title', 'for': 'tailValue' },
							_('Show only the last messages')),
						E('div', { 'class': 'cbi-value-field' }, [
							tailValue,
							E('input', {
								'type': 'button',
								'class': 'cbi-button btn cbi-button-reset',
								'value': 'Χ',
								'click': ev => {
									tailValue.value = null;
									logFormSubmitBtn.click();
									ev.target.blur();
								},

							}),
							logFilter,
							E('input', {
								'type': 'button',
								'class': 'cbi-button btn cbi-button-reset',
								'value': 'Χ',
								'click': ev => {
									logFilter.value = null;
									logFormSubmitBtn.click();
									ev.target.blur();
								},
							}),
							logFormSubmitBtn,
							E('form', {
								'id': 'logForm',
								'name': 'logForm',
								'style': 'display:inline-block; margin-left:1em !important',
								'submit': ui.createHandlerFn(this, function(ev) {
									ev.preventDefault();
									let formElems = Array.from(document.forms.logForm.elements);
									formElems.forEach(e => e.disabled = true);

									return this.getLogData(
										(tailValue.value && tailValue.value > 0) ? tailValue.value : 0,
										logFilter.value || this.patternDefault
									).then(logdata => {
										logdata = logdata || '';
										let loglines = logdata.match(/\n/g) || [];

										if(loglines.length === 0) {
											logdata = _('No matches...');
										};

										logTextarea.rows = (loglines.length < this.tailDefault) ?
											this.tailDefault : loglines.length;
										logTextarea.value = logdata.trim();
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
				E('div', { 'class': 'cbi-section-node' },
					E('div', { 'class': 'cbi-value' }, [
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
				)
			),
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
});

