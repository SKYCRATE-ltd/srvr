// Let's continue here. This will
// read the nginx directory for:
// which sites are available
// which are enabled
// Then we can add and remove them.
// These are ngninx configs that point
// to folders in the /var/www directory
// These are gonna be symlinks? we'll have to think about it.

import {
	read_dir,
	
} from "computer";