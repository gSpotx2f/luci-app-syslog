
module('luci.controller.syslog', package.seeall)

function index()
    entry({'admin', 'services', 'syslog'}, view('syslog'), _('System Log'), 20).acl_depends = { 'luci-app-syslog' }
end
