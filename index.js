import {
	read_dir, resolve_dir,
	copy, map, del, write,
	is_sudo, exists, exec
} from "computer";
import Program from "termite";
import DNS from "hosts";

// HEY! Should we import the DNS program? It's actually
// kind of a good idea! We use it to set 'oor domains!
// Yeah, for all thingies, we need to know what's what so, prepare that shit first.
const IP = '127.0.0.1'; // We be playin wit localnames only ever. // Unless it's for VLAN.
const WWW = '/var/www';
const DIR = '/etc/nginx';
const AVAILABLE_DIR = `${DIR}/sites-available`;
const ENABLED_DIR = `${DIR}/sites-enabled`;
const AVAILABLE = read_dir(AVAILABLE_DIR);
const ENABLED = read_dir(ENABLED_DIR);

export default Program({
	["@default"]() {
		return this.pass('list');
	},
	["@init"](cmd, domain) {
		if (cmd !== "list") {
			if (cmd !== 'init' && !is_sudo())
				return this.error(`please run '${cmd}' as sudo.`);

			if (!domain)
				return this.error('no domain name passed.');
		}
	},
	init(domain, dir = '.') {
		dir = resolve_dir(dir);

		this.header(`SRVR: local dev config`);
		this.info(`${dir}/etc/${domain}`);

		write(`${dir}/etc/${domain}`, `
# DOMAIN: (https|http)://${domain}
# SOURCE: ${dir}
# generated on ${new Date().toLocaleString().replace(', ', ' @ ')}

server {
	listen 80;
	listen [::]:80;

	server_name ${domain};

	root ${WWW}/${domain}/public;
	index index.html;

	location / {
		try_files $uri $uri/ =404;
	}

	# TODO: https stuff for LAN (mkcert)
	# TODO: https stuff for product (certbot?)
}
`);
		this.hr();
		this.done();
		this.exit(); // let's just bail here.
	},
	list() {
		return this.header('SRVR: sites available') + this.list(AVAILABLE.map(
			site => `[${ENABLED.includes(site) ? 'X' : ' ' }] ${site}`
		));
	},
	add(domain, dir = '.') {
		dir = resolve_dir(dir);
		
		this.header(`SRVR: ${domain}`);
		this.list([
			`SOURCE: ${dir}`,
			`TARGET: ${WWW}`
		]);
		const config = `${dir}/etc/${domain}`;
		if (!exists(config))
			return this.error(`configuration '${config}' not found`);
		
		if (dir !== `${WWW}/${domain}`) {
			this.log(`mapping project to ${WWW}/${domain}`);
			map(dir, `${WWW}/${domain}`);
		}
		
		this.log(`copying ${dir}/etc/${domain} to ${AVAILABLE_DIR}`);
		copy(config, AVAILABLE_DIR);

		this.pass('enable', domain);
	},
	remove(domain) {
		this.header(`REMOVE: ${domain}`);

		if (exec(`if [ -L ${WWW}/${domain} ]; then echo true; fi`)) {
			this.warn(`deleting ${domain} from ${WWW}`);
			del(`${WWW}/${domain}`);
		}

		this.pass('disable', domain);
		this.hr();

		this.warn(`removing site configuration:`);
		del(`${AVAILABLE_DIR}/${domain}`);
	},
	enable(domain) {
		this.header(`ENABLE: ${domain}`);

		this.log(`mapping ${domain} config to ${ENABLED_DIR}`);
		map(`${AVAILABLE_DIR}/${domain}`, `${ENABLED_DIR}/${domain}`);
		
		this.log(`DNS: adding ${domain} to hosts file...`);
		this.hr();
		DNS('add', IP, domain);
	},
	disable(domain) {
		this.header(`DISABLE: ${domain}`)

		this.warn(`deleting ${domain} from ${ENABLED_DIR}`);
		del(`${ENABLED_DIR}/${domain}`);
		
		this.warn(`removing ${domain} => ${IP} from hosts file...`);
		this.hr();
		DNS('remove', IP, domain);
	},
	["@end"](cmd) {
		if (cmd !== "list")
			this.hr() && this.info('resetting nginx server') &&
				exec(`nginx -s reload`) || this.done();
	}
});
// Rightr, so this is what we finish this afternoon, then we get
// the website finished with a little design flare! Then we get it online!