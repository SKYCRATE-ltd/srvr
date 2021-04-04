import {
	read_dir, resolve_dir,
	copy, map, del, write,
	is_sudo, exists, exec
} from "computer";
import {
	EOL
} from "os";
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
	},
	list() {
		return this.list(AVAILABLE.map(
			site => `[${ENABLED.includes(site) ? 'X' : ' ' }] ${site}`
		));
	},
	add(domain, dir = '.') {
		dir = resolve_dir(dir);

		const config = `${dir}/etc/${domain}`;
		if (!exists(config))
			return this.error(`configuration '${config}' not found`);
		
		map(dir, `${WWW}/${domain}`);
		copy(config, AVAILABLE_DIR);

		this.pass('enable', domain);
	},
	remove(domain) {
		del(`${WWW}/${domain}`);
		del(`${AVAILABLE_DIR}/${domain}`);

		this.pass('disable', domain);
	},
	enable(domain) {
		map(`${AVAILABLE_DIR}/${domain}`, `${ENABLED_DIR}/${domain}`);
		DNS('add', IP, domain);
	},
	disable(domain) {
		del(`${ENABLED_DIR}/${domain}`);
		DNS('remove', IP, domain);
	},
	["@end"](cmd) {
		if (cmd !== "list")
			exec(`nginx -s reload`);
	}
});
// Rightr, so this is what we finish this afternoon, then we get
// the website finished with a little design flare! Then we get it online!