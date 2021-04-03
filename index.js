import {
	read_dir,
	copy,
	map,
	exec
} from "computer";
import Program from "termite";
import DNS from "hosts";
import { pathToFileURL } from "node:url";

// HEY! Should we import the DNS program? It's actually
// kind of a good idea! We use it to set 'oor domains!
// Yeah, for all thingies, we need to know what's what so, prepare that shit first.
const IP = '127.0.0.1'; // We be playin wit localnames only ever. // Unless it's for VLAN.
const NEWLINE = '\n';
const WWW = '/var/www';
const DIR = '/etc/nginx';
const AVAILABLE_DIR = `${DIR}/sites-available`;
const ENABLED_DIR = `${DIR}/sites-enabled`;
const AVAILABLE = read_dir(AVAILABLE_DIR);
const ENABLED = read_dir(ENABLED_DIR);

export default Program({
	list() {
		return AVAILABLE.map(
			site => `${ENABLED.includes(site) ? '✔' : '✘' } ${site}`
		).join(NEWLINE);
	},
	add(domain, dir = '.') {
		if (process.env.EUID === 0)
			return this.error('please run as sudo.');
		
		if (!domain)
			return this.error('no domain name passed.')

		dir = pathToFileURL.resolve(dir);
		
		// create a link to project at /var/www
		map(dir, `${WWW}/${domain}`);
		// make our configuration available
		copy(`${dir}/${domain}`, AVAILABLE_DIR); // That should suffice
		// enable the site by default:
		map(`${AVAILABLE_DIR}/${domain}`, `${ENABLED_DIR}/${domain}`);

		// Add domain name to local DNS:
		DNS('add', IP, domain);

		// Then, all we gotta do is reset nginx
		exec(`ngnix -s reload`);
	},
	remove(domain) {

	},
	enable() {

	},
	disable() {

	}
});
// Rightr, so this is what we finish this afternoon, then we get
// the website finished with a little design flare! Then we get it online!