// Helpers from jini-2 (Bithack's minimal javascript framework?)
$ = function (el, from) {
	return (from || document).getElementById(el);
}

$hide = function (el) { $S(el, {'display': 'none'}); };
$show = function (el) { $S(el, {'display': 'block'}); };

$S = function (el, arg) {
	var _n = function (s) {
		var o;
		if ((o = s.indexOf('-')) != -1)
			s = s.substr(0, o) + s[o+1].toUpperCase() + s.substr(o+2);
		return s;
	};

	if (typeof el == "string")
		el = $(el);

	if (typeof arg == "string")
		return el.style[_n(arg)];

	if (arg instanceof Array) {
		var ret = {};
		for (x in arg)
			ret[arg[x]] = $S(el, arg[x]);
		return ret;
	}

	for (a in arg) {
		if (a == 'opacity' && document.attachEvent)
			el.style.filter = 'alpha(opacity='+(arg[a]*100)+')';
		else {
			var v;
			if (arg[a] instanceof Array) {
				v = arg[a];
				v = 'rgb('+v[0]+','+v[1]+','+v[2]+')';
			} else
				v = arg[a];
			el.style[_n(a)] = v;
		}
	}
};

// Image to lua code
function clear_me() {
	var img_info = $('img_info');
	var img_help = $('img_help');
	var img_draw = $('img_draw');
	$S(img_info, { 'display': 'none' });
	$S(img_help, { 'display': 'none' });
	$S(img_draw, { 'display': 'none' });

	var code_container = $('code_container');
	$S(code_container, { 'display': 'none' });

	var code_1 = $('code_1');
	var code_2 = $('code_2');
	var str_len_1 = $('str_len_1');
	var str_len_2 = $('str_len_2');

	code_1.value = '';
	code_2.value = '';

	str_len_1.innerHTML = 'Optimal code';
	str_len_2.innerHTML = 'Sub-optimal code';

	var canvas = $('temp_canvas');

	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, 512, 512);
}

function do_it() {
	var el = $('temp_upload');
	var canvas = $('temp_canvas');
	var img = $('temp_img');
	var include_alpha = $('include_alpha').checked;
	var img_info = $('img_info');
	var img_help = $('img_help');
	var img_draw = $('img_draw');
	var loading = $('loading');
	$S(img_info, { 'display': 'none' });
	$S(img_help, { 'display': 'none' });
	$S(loading, { 'display': 'block' });

	var code_container = $('code_container');
	$S(code_container, { 'display': 'none' });

	img.src = '';

	if (el.files.length == 1) {
		var f = el.files[0];
		if (f.type.match(/image.*/)) {
			var reader = new FileReader();

			reader.onload = function (e) { img.src = e.target.result; }
			reader.readAsDataURL(f);

			img.onload = function (e) {
				var w = img.width;
				var h = img.height;

				var img_width = document.getElementById('img_width');
				var img_height = document.getElementById('img_height');
				img_width.innerHTML = w;
				img_height.innerHTML = h;

				canvas.width = w;
				canvas.height = h;

				var ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, 512, 512);
				ctx.drawImage(img, 0, 0);

				var img_data = ctx.getImageData(0, 0, w, h);
				var data = img_data.data;

				var str_1 = '';

				var str_2 = '';
				var vars = '';

				var str_3 = '';
				var prev_ic = -1;
				var var_counter = 0;

				var colors = [];
				var counter = 0;

				var varname = '';

				var s = 0;
				for (var i = 0, n = data.length; i < n; i += 4) {
					var red = data[i];
					var green = data[i + 1];
					var blue = data[i + 2];
					var alpha = 0;
					var color_str = '';
					if (include_alpha) {
						alpha = data[i + 3];
						color_str = '{' + red + ',' + green + ',' + blue + ',' + alpha + '}';
					} else {
						color_str = '{' + red + ',' + green + ',' + blue + '}';
					}

					var ic = red + (green << 8) + (blue << 16) + (alpha << 24);

					var c = colors[ic];

					if (ic == prev_ic || prev_ic == -1) {
						var_counter = var_counter + 1;
					} else {
						// push changes
						str_3 += '{' + varname + ',' + var_counter + '},';
						var_counter = 1;
					}

					if (c === undefined) {
						varname = 'c' + ++counter;
						colors[ic] = varname;
						vars += varname + '=' + color_str + ';';
					} else {
						varname = c;
					}

					str_1 += color_str + ',';
					str_2 += varname + ',';

					prev_ic = ic;

					console.log(s % w && s > w);

					if (s++ % w == w - 1) {
						/*
						str_1 += '\n';
						str_2 += '\n';
						*/
					}
				}

				str_3 += '{' + varname + ',' + var_counter + '},';

				var code_1 = $('code_1');
				var code_2 = $('code_2');
				var str_len_1 = $('str_len_1');
				var str_len_2 = $('str_len_2');

				var bx = $('base_x');
				var by = $('base_y');

				str_1 = 'base_x=' + bx.value + ';base_y=' + by.value + ';colors={ ' + str_1 + '}';
				str_2 = 'base_x=' + bx.value + ';base_y=' + by.value + ';' + vars + '\ncolors={ ' + str_2 + '}';
				str_3 = 'base_x=' + bx.value + ';base_y=' + by.value + ';' + vars + '\ncolors={ ' + str_3 + '}';

				str_1 = 'img_width=' + w + '\nimg_height=' + h + '\n' + str_1;
				str_2 = 'img_width=' + w + '\nimg_height=' + h + '\n' + str_2;
				str_3 = 'img_width=' + w + '\nimg_height=' + h + '\n' + str_3;

				var best_str = '';
				var best_str_len = 0;

				if (str_1.length > str_2.length) {
					best_str = str_2;
					best_str_len = str_2.length;
				} else {
					best_str = str_1;
					best_str_len = str_1.length;
				}

				code_1.value = best_str;
				str_len_1.innerHTML = 'Variant #1 (Optimal code, ' + best_str_len + ' chars)';

				code_2.value = str_3;
				str_len_2.innerHTML = 'Variant #2 (Sub-optimal code, ' + str_3.length + ' chars)';

				console.log('str1: ' + str_1.length);
				console.log('str2: ' + str_2.length);
				console.log('str3: ' + str_3.length);

				var draw_image = $('draw_image');
				draw_image.value = 'function step()\n\tthis:draw_sprite(0, 0, 0, 5, 5, base_x, base_y, base_x+img_width, base_y+img_height)\nend';

				$S(code_container, { 'display': 'block' });
				$S(img_info, { 'display': 'block' });
				$S(img_help, { 'display': 'block' });
				$S(img_draw, { 'display': 'block' });
				$S(loading, { 'display': 'none' });
			}
		} else {
			$S(loading, { 'display': 'block' });
		}
	} else {
		$S(loading, { 'display': 'block' });
	}
}
