'use strict';
'require fs';
'require ui';

return L.view.extend({
	tail_default: 25,
	pattern_default: '^',

	get_log_data: function(last, pattern) {
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
		return this.get_log_data(this.tail_default, this.pattern_default);
	},

	render: function(logdata) {
		let nav_btns_top = '120px';

		let log_textarea = E('textarea', {
			'id': 'syslog',
			'class': 'cbi-input-textarea',
			'style': 'width:100% !important; resize:horizontal; padding: 0 0 0 45px; font-size:12px',
			'readonly': 'readonly',
			'wrap': 'off',
			'rows': this.tail_default,
			'spellcheck': 'false',
		}, [ logdata.trim() ]);

		let tail_value = E('input', {
			'id': 'tail_value',
			'name': 'tail_value',
			'type': 'text',
			'form': 'log_form',
			'class': 'cbi-input-text',
			'style': 'width:4em !important; min-width:4em !important',
			'maxlength': 5,
		});
		tail_value.value = this.tail_default;
		ui.addValidator(tail_value, 'uinteger', true);

		let log_filter = E('input', {
			'id': 'log_filter',
			'name': 'log_filter',
			'type': 'text',
			'form': 'log_form',
			'class': 'cbi-input-text',
			'style': 'margin-left:1em !important; width:16em !important; min-width:16em !important',
			'placeholder': _('Message filter'),
			'data-tooltip': _('Filter messages with a regexp'),
		});

		let log_form_submit_btn = E('input', {
			'type': 'submit',
			'form': 'log_form',
			'class': 'cbi-button btn',
			'style': 'margin-left:1em !important; vertical-align:middle',
			'value': _('Apply'),
			'click': ev => ev.target.blur(),
		});

		return E([
			E('h2', { 'id': 'log_title', 'class': 'fade-in' }, _('System Log')),
			E('div', { 'class': 'cbi-section-descr fade-in' }),
			E('div', { 'class': 'cbi-section fade-in' },
				E('div', { 'class': 'cbi-section-node' },
					E('div', { 'id': 'content_syslog', 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title', 'for': 'tail_value' },
							_('Show only the last messages')),
						E('div', { 'class': 'cbi-value-field' }, [
							tail_value,
							E('input', {
								'type': 'button',
								'class': 'cbi-button btn cbi-button-reset',
								'value': 'Χ',
								'click': ev => {
									tail_value.value = null;
									log_form_submit_btn.click();
									ev.target.blur();
								},

							}),
							log_filter,
							E('input', {
								'type': 'button',
								'class': 'cbi-button btn cbi-button-reset',
								'value': 'Χ',
								'click': ev => {
									log_filter.value = null;
									log_form_submit_btn.click();
									ev.target.blur();
								},
							}),
							log_form_submit_btn,
							E('form', {
								'id': 'log_form',
								'name': 'log_form',
								'style': 'display:inline-block; margin-left:1em !important',
								'submit': ui.createHandlerFn(this, function(ev) {
									ev.preventDefault();
									let form_elems = Array.from(document.forms.log_form.elements);
									form_elems.forEach(e => e.disabled = true);

									return this.get_log_data(
										(tail_value.value && tail_value.value > 0) ? tail_value.value : 0,
										log_filter.value || this.pattern_default
									).then(logdata => {
										logdata = logdata || '';
										let loglines = logdata.match(/\n/g) || [];

										if(loglines.length === 0) {
											logdata = _('No matches...');
										};

										log_textarea.rows = (loglines.length < this.tail_default) ?
											this.tail_default : loglines.length;
										log_textarea.value = logdata.trim();
									}).finally(() => {
										form_elems.forEach(e => e.disabled = false);
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
									+ nav_btns_top,
								'click': ev => {
									document.getElementById('log_title').scrollIntoView(true);
									ev.target.blur();
								},
							}, '&#8593;'),
							E('button', {
								'class': 'btn',
								'style': 'position:relative; display:block; margin:0 !important; margin-top:1px !important; left:1px; top:'
									+ nav_btns_top,
								'click': ev => {
									log_textarea.scrollIntoView(false);
									ev.target.blur();
								},
							}, '&#8595;'),
						]),
						log_textarea,
					])
				)
			),
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
});

