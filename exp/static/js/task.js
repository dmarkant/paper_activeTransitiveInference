
var	version = 1.1,
	TESTING = false,
	SEED = true, // no yoking yet
	SHOW_NAMES = false,
	PA_NUMBER_ITEMS_PER_ROUND = 16,
	TI_NUMBER_ITEMS_PER_ROUND = 9,
	N_STUDY_TRIALS = 56,
	N_TEST_TRIALS = undefined, // if undefined, determined below
	STUDY_NROWS = 2,
	STUDY_NCOLS = 2,
	N_BLOCKS = 2,
	STUDY_FRAME_DELAY = 500,
	STUDY_DURATION = 2000, // 'none' | 'selfpaced' | fixed t
	STAGE_ASPECT = .7,
	STAGE_HEIGHT = 700,
	STAGE_WIDTH = 800,
	BREAK_DURATION = 120, // seconds
	STUDY_COND,
	IMAGE_TYPE,
	IMAGES_ACTIVE,
	IMAGES_YOKED,
	NAMES_ACTIVE,
	NAMES_YOKED;

var exp,
	active_item = undefined,
	yokeddata = [],
	stimuli,
	testitems,
	test_items_selected,
	test_accuracy = [[], []],
	outpfx = [],
	timeouts = [],
	partnerdata = [],
	ids = uniqueId.split(':'),
	block_start_time,
	sampled_options = [[], []];


if (TESTING) {
	BREAK_DURATION = 10;
	N_STUDY_TRIALS = 2;
	N_TEST_TRIALS = 2;
}


// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);
var LOGGING = true;
//var SAVEDATA = (ids[0].indexOf('throwaway') > -1) ? false : true;
var SAVEDATA = true;
var SKIP_INSTRUCTIONS = false;
var SIMULATE = false;

// Generic function for saving data
function output(arr) {
	arr = outpfx.concat(arr);
    if (SAVEDATA) psiTurk.recordTrialData(arr);
    if (LOGGING) console.log(arr.join(" "));
};


// For this yoked, lab-only experiment, the uniqueId
// has the format <new participant id>:<partner id>
var partnerid = ids[1];


// PA or TI
TASK_COND = ['TI', 'PA'][condition];



counterbalance = Number(counterbalance);
output(['counterbalance', counterbalance]);


/*
STUDY_COND = shuffle(['active', 'yoked']);

// randomize stimulus set in each condition
if (Math.random() < .5) {
	IMAGE_TYPE = ['men', 'women'];
	if (STUDY_COND[0]=='active') {
		IMAGES_ACTIVE = IMAGES_MEN;
		IMAGES_YOKED = IMAGES_WOMEN;
		NAMES_ACTIVE = shuffle(NAMES_MEN);
		NAMES_YOKED = shuffle(NAMES_WOMEN);
	} else {
		IMAGES_ACTIVE = IMAGES_WOMEN;
		IMAGES_YOKED = IMAGES_MEN;
		NAMES_ACTIVE = shuffle(NAMES_WOMEN);
		NAMES_YOKED = shuffle(NAMES_MEN);
	}
} else {
	IMAGE_TYPE = ['women', 'men'];
	if (STUDY_COND[0]=='active') {
		IMAGES_ACTIVE = IMAGES_WOMEN;
		IMAGES_YOKED = IMAGES_MEN;
		NAMES_ACTIVE = shuffle(NAMES_WOMEN);
		NAMES_YOKED = shuffle(NAMES_MEN);
	} else {
		IMAGES_ACTIVE = IMAGES_MEN;
		IMAGES_YOKED = IMAGES_WOMEN;
		NAMES_ACTIVE = shuffle(NAMES_MEN);
		NAMES_YOKED = shuffle(NAMES_WOMEN);
	}
}
*/


// in passive study, equal probability of selecting
// near and far images
var DIST_PASSIVE = shuffle(_.map(_.range(N_STUDY_TRIALS), function(i) { return i % 2; }));


// If retesting a participant, treat it as a
// seed since there is no yoked partner
var RETEST = (ids[0].indexOf('-retest') > -1);


// Loading data for yoked partner
var partner_result = [];
/*if (!SEED) {
	output(['requesting partner data']);
	$.ajax({url: 'partnerdata',
			data: 'partnerid='+partnerid,
			type: 'GET',
			async: false,
			timeout: 10000,
			dataType: 'json',
			success: function(data) {
				output(['retrieved partner data']);
				partner_result = data;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				output(['failed to retrieve data for partner: '+partnerid]);
				output(['switching to active only!']);
				SEED = true;
			}
	});
}*/


// If this is a retest, load data from first session
var prev_test_data = [];
if (RETEST) {
	output(['requesting data from first session']);
	$.ajax({url: 'participantdata',
			data: 'participantid='+ids[0].slice(0, ids[0].indexOf('-retest')),
			type: 'GET',
			async: false,
			timeout: 10000,
			dataType: 'json',
			success: function(data) {
				output(['retrieved participant data']);
				prev_test_data = data['participant_data'];
			},
			error: function(jqXHR, textStatus, errorThrown) {
				output(['failed to retrieve data for participant: '+ids[0]]);
				RETEST = false;
			}
	});

	STUDY_COND = _.filter(prev_test_data, function(row) { return row[0]=='study_cond'})[0].slice(1,3)
	IMAGE_TYPE = _.filter(prev_test_data, function(row) { return row[0]=='image_type'})[0].slice(1,3)

	if (IMAGE_TYPE[0]=='men') {
		if (STUDY_COND[0]=='active') {
			IMAGES_ACTIVE = IMAGES_MEN;
			IMAGES_YOKED = IMAGES_WOMEN;
		} else {
			IMAGES_ACTIVE = IMAGES_WOMEN;
			IMAGES_YOKED = IMAGES_MEN;
		}
	} else {
		if (STUDY_COND[0]=='active') {
			IMAGES_ACTIVE = IMAGES_WOMEN;
			IMAGES_YOKED = IMAGES_MEN;
		} else {
			IMAGES_ACTIVE = IMAGES_MEN;
			IMAGES_YOKED = IMAGES_WOMEN;
		}
	}

};





psiTurk.preloadPages(['setup.html',
					  'chooser.html',
					  'instruct.html',
					  'stage.html',
					  'postquestionnaire.html',
					  'summary.html']);

// load images defined in stimuli.js
psiTurk.preloadImages(IMAGES_MEN);
psiTurk.preloadImages(IMAGES_WOMEN);
psiTurk.preloadImages(['static/images/arrow_right.png',
					   'static/images/study_example_PA.png',
					   'static/images/study_example_TI.png']);


$('#loading').css('display', 'none');

// disable vertical bounce
$(document).bind(
      'touchmove',
          function(e) {
            e.preventDefault();
          }
);

var h = $(window).height() * .9;
if (h < STAGE_HEIGHT) {
	STAGE_HEIGHT = h;
	STAGE_WIDTH = h/STAGE_ASPECT;
}


// set study event based on user-agent
var SELECT_EVENT = (navigator.userAgent.indexOf('iPad') == -1) ? 'click' : 'touchstart';



function clear_timeouts() {
	$.each(timeouts, function(i, to) {
		clearTimeout(to);
	})
	timeouts = [];
};

function timestamp() {
	return Date.now();
	//return Math.floor(window.performance.now() || Date.now());
}


var Item = function(pars) {
	var self = this;
	self.stage = pars['stage'];
	self.ind = pars['ind'];
	self.stimid = pars['id'];
	self.id = 'item-' + self.ind;
	self.row = pars['row'];
	self.col = pars['col'];
	self.width = pars['width'];
	self.height = pars['height'];
	self.x_off = pars['x_off'] | 0;
	self.y_off = pars['y_off'] | 0;
	self.spacing_x = 100;

	self.x = (self.width + self.spacing_x) * self.row + self.x_off;
	self.y = self.height * self.col + self.y_off;
	self.framedelay = pars['framedelay'];
	self.duration = pars['duration'];
	self.img = pars['image'];
	self.blocking = pars['blocking'] | true;
	self.cond = pars['cond'];
	self.facecolor = pars['facecolor'] || '#E6E6E6';
	self.name = pars['name'];

	// item rendering
	padding_x = 50;
	padding_y = 40;
	self.obj_x = self.x + padding_x;
	self.obj_y = self.y + padding_y;
	self.obj_w = self.width - 2 * padding_x;
	self.obj_h = self.height - 2 * padding_y - 20;

	// state variables
	self.active = false;
	self.framed = false;

	// for storing study data
	self.episode = {};

	output(['item', 'id='+self.stimid, 'ind='+self.ind, 'row='+self.row,
		    'col='+self.col, 'image='+self.img, 'cond='+self.cond]);


	self.disp = self.stage.append('g')
						  .attr('id', self.id);

	// background
	self.back = self.disp.append('rect')
						  .attr('x', self.x + padding_x/2)
						  .attr('y', self.y + padding_y/2)
						  .attr('width', self.width - padding_x)
						  .attr('height', self.height - padding_y)
						  .attr('rx', 15)
						  .attr('ry', 15)
						  .attr('fill', 'white')
						  .attr('opacity', 1.)

	self.face = self.disp.append('text')
						.text(self.word)
						.attr('x', self.obj_x + self.width/2 - padding_x)
						.attr('y', self.obj_y + self.height/2)
						.attr('text-anchor', 'middle')
						.style('font-size', '1.8em')
						.style('font-family', 'Helvetica')
						.attr('opacity', 0.)

	// the image
	self.obj = self.disp.append('image')
						.attr('x', self.obj_x)
						.attr('y', self.obj_y)
						.attr('width', self.obj_w)
						.attr('height', self.obj_h)
						.attr('opacity', 0.)
						.attr('xlink:href', self.img);

	self.nameplate = self.disp.append('text')
							  .text(self.name)
							  .attr('x', self.obj_x + self.width/2 - padding_x)
							  .attr('y', self.obj_y + self.height - padding_y - 30)
							  .attr('text-anchor', 'middle')
							  .style('font-size', '1.8em')
							  .style('font-family', 'Helvetica')
							  .style('font-weight', 'bold')
							  .attr('opacity', 0.)

	self.frame = self.disp.append('rect')
						  .attr('x', self.x + padding_x/2)
						  .attr('y', self.y + padding_y/2)
						  .attr('width', self.width - padding_x)
						  .attr('height', self.height - padding_y)
						  .attr('rx', 15)
						  .attr('ry', 15)
						  .attr('stroke-width', 3)
						  .attr('stroke', '#D8D8D8')
						  .attr('fill', 'none')
						  .attr('opacity', 0.)

	self.set_facecolor = function(col) {
		self.face.attr('fill', col);
		self.facecolor = col;
	}

	self.frame_on = function() {
		output([self.id, 'frame_highlight_on'])
		self.framed = true;
		self.frame.attr('stroke', 'red')
				  .attr('opacity', 1.);
	};

	self.frame_inactive = function() {
		output([self.id, 'frame_highlight_off'])
		self.framed = false;
		self.frame.attr('stroke', '#D8D8D8')
				  .attr('opacity', 1.);
	};

	self.frame_off = function() {
		output([self.id, 'frame_off'])
		self.framed = false;
		self.frame.attr('opacity', 0.);
	};

	self.object_on = function() {
		output([self.id, 'object_on'])
		self.framed = false;
		self.face.attr('opacity', 0.);
		self.obj.attr('opacity', 1.)
		if (SHOW_NAMES) {
			self.nameplate.attr('opacity', 1.)
		}
	};

	self.object_off = function() {
		output([self.id, 'object_off'])
		self.active = false;
		self.face.attr('opacity', 1.);
		self.obj.attr('opacity', 0.)
		self.nameplate.attr('opacity', 0.)
	};

	self.show = function(duration, callback) {
		//self.frame_inactive();
		self.object_on();
		to = setTimeout(function() {
			self.object_off();
			if (callback) callback();
		}, duration);
		timeouts.push(to);
	};

	self.study = function() {
		output([self.id, 'study'])

		self.object_on();

		switch (self.duration) {

			case 'none':
				break;
			case 'selfpaced':
				self.listen();
				break;
			default:
				to = setTimeout(function() {
					self.unstudy();
				}, self.duration);
				timeouts.push(to);
				break;
		};

	};

	self.unstudy = function(callback) {
		active_item = undefined;
		self.object_off();
		self.frame_inactive();
		self.episode['end_time'] = timestamp() - block_start_time;
		self.episode['duration'] = self.episode['end_time'] - self.episode['start_time'];
		output([self.id, 'episode', self.episode['start_time'], self.episode['end_time'], self.episode['duration']]);
		if (callback) callback();
	}

	self.listen = function() {

		self.disp.on(SELECT_EVENT, function() {

			// if not active, then proceed with study episode
			if (!self.active && active_item==undefined) {

				self.episode['start_time'] = timestamp() - block_start_time;

				self.active = true;
				if (self.blocking) active_item = self;

				self.frame_on();
				self.unlisten();
				//to = setTimeout(function() {
				//	self.study();
				//}, self.framedelay);
				//timeouts.push(to);

			// otherwise only handle clicks if study
			// duration is self-paced
			} else if (self.id==active_item.id && self.duration=='selfpaced') {
				self.unstudy();
			};

		});

	};

	self.listen_yoked = function() {
		self.disp.on(SELECT_EVENT, function() {
			output([self.id, 'clicked']);
			self.unlisten();
		})
	}

	self.listen_test = function(callback) {

		self.disp.on(SELECT_EVENT, function() {


			if (!self.active && active_item==undefined) {

				self.active = true;
				if (self.blocking) active_item = self;
				self.frame_on();
				setTimeout(function() {
					callback(self.stimid);
				}, 200);

			}
		});

	}


	self.unlisten = function() {
		self.disp.on(SELECT_EVENT, function() {});
	};

	self.remove = function() {
		self.disp.remove();
	}


};


function sample_options_PA(block, trial) {

	// possible options
	options = range(8);
	stimids = stimuli[block];

	var pairs = _.map(range(8).sample(2), function(ind) {
		return shuffle([stimids[ind*2], stimids[ind*2+1]]);
	});

	return shuffle(pairs);

}

function sample_options_TI(block, trial) {

	// possible options (excluding last one)
	options = range(8);
	stimids = stimuli[block];

	if (trial==0) {
		first = options.sample(1)[0];
		left = _.difference(options, [first-1, first, first+1]);
		second = left.sample(1)[0];
	} else {

		prev = sampled_options[block][trial-1];
		prev_ind = stimids.indexOf(prev);

		near_ind = _.filter(options, function(ind) {
			var dist = Math.abs(prev_ind - ind);
			return (dist >0) & (dist <= 2);
		})
		far_ind  = _.filter(options, function(ind) { return Math.abs(prev_ind - ind) > 2; })

		first = near_ind.sample(1)[0];
		second = far_ind.sample(1)[0];

	}
	return shuffle([[stimids[first], stimids[first+1], 'near'],
				    [stimids[second], stimids[second+1], 'far']]);
}


function sample_test_trials_TI(block) {

	stimids = stimuli[block];

	all = []

	for (var b=0; b < 3; b++) {

		// studied associations
		studied = _.map(range(8), function(ind) { return [ind, ind+1]; });

		arr = [];
		for (var i=0; i<9; i++) {
			for (var j=(i+1); j<9; j++) {
				arr.push([i, j, Math.abs(i - j)]);
			}
		};

		near = _.filter(arr, function(test) { return (test[2] > 1) & (test[2] <= 3); })
		near = _.map(near.sample(8), function(test) { return test.slice(0,2); });

		far = _.filter(arr, function(test) { return (test[2] > 3); })
		far = _.map(far.sample(8), function(test) { return test.slice(0,2); });

		mb = shuffle(studied.concat(near).concat(far));
		all = all.concat(mb);
	}

	return _.map(all, function(test) { return [stimids[test[0]], stimids[test[1]]]; });

}


var StudyTrial = function(block, trial) {
	var self = this;
	active_item = undefined,

	//self.study_cond = (SEED) ? 'active' : STUDY_COND[block];
	self.study_cond = STUDY_COND[block];
	if (self.study_cond == 'active') {
		IMAGES = IMAGES_ACTIVE;
		NAMES = NAMES_ACTIVE;
	} else {
		IMAGES = IMAGES_YOKED;
		NAMES = NAMES_YOKED;
		//self.yevent_ind = -1;
		//self.yevent_data = yokeddata[Math.floor(block/2)]['episodes'];
	}

	outpfx =['study', block, self.study_cond, trial];
	output(['init']);
	psiTurk.showPage('stage.html');
	self.above_stage = d3.select("#aboveStage");
	self.stage = d3.select('#stagesvg');
	self.stage.attr('width', STAGE_WIDTH);
	self.stage.attr('height', STAGE_HEIGHT);

	self.nrow = STUDY_NROWS;
	self.ncol = STUDY_NCOLS;
	self.items = [];
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = self.stage_h; // square
	self.y_off = 50;
	self.x_off = (Number(self.stage.attr("width")) - self.stage_w) / 2;
	self.item_w = (self.stage_w - 100) / self.nrow;
	self.item_h = (self.stage_h - 40) / self.ncol;

	// sample options for this trial
	if (TASK_COND=='PA') {
		var pairs = sample_options_PA(block, trial);
	} else if (TASK_COND=='TI') {
		var pairs = sample_options_TI(block, trial);
	}

	var dist = [pairs[0][2], pairs[1][2]];

	// the pair that comes first is on the top of the screen
	output(['option', 0, 'id='+pairs[0][0], 'id='+pairs[0][1]]);
	output(['option', 1, 'id='+pairs[1][0], 'id='+pairs[1][1]]);

	for (var i=0; i<self.nrow; i++) {
		for (var j=0; j<self.ncol; j++) {
			var stimid = pairs[j][i];
			var ind = i * self.nrow + j;
			var img = IMAGES[stimid];
			var name = NAMES[stimid];
			self.items.push(new Item({'stage': self.stage,
									  'id': stimid,
									  'ind': ind,
									  'row': i,
									  'col': j,
									  'y_off': self.y_off,
									  'x_off': self.x_off,
									  'width': self.item_w,
									  'height': self.item_h,
									  'image': img,
									  'framedelay': STUDY_FRAME_DELAY,
									  'duration': STUDY_DURATION,
									  'cond': self.study_cond,
									  'name': name
									 }))
		};
	};


	self.study = function() {

		$.each(self.items, function(i, item) {
			if (item.row==0) {
				item.object_on();
				item.frame_inactive();
			} else {
				item.object_off();
				item.frame_off();
			}
		});
		if (self.study_cond == 'active') {
			self.study_active();
		} else {
			self.study_random();
			//self.study_yoked();
		}
	};


	self.study_active = function() {
		output(['active_study_begin']);
		block_start_time = timestamp();

		$.each(self.items, function(i, item) {
			if (item.row==0) {
				item.listen();
			}
		});

		self.listen_for_selection();
	};

	self.study_random = function() {
		output(['active_study_begin']);
		block_start_time = timestamp();

		//var sel = [0, 1].sample(1)[0];
		var dist_t = ['near', 'far'][DIST_PASSIVE[trial]];
		var sel = dist.indexOf(dist_t);

		$.each(self.items, function(i, item) {
			if ((item.row==0) & (item.col==sel)) {
				item.frame_on();
				item.listen();
			}
		});

		self.listen_for_selection();
	};

	self.study_yoked = function() {
		output(['yoked_study_begin']);
		block_start_time = timestamp();

		var event_ind = -1;
		for (i=0; i<self.yevent_data.length; i++) {

			episode = self.yevent_data[i];
			onset_t = episode['start_time'];

			if (onset_t < STUDY_BLOCK_TIME) {

				to = setTimeout(function() {

					event_ind += 1;
					item_ind = Number(self.yevent_data[event_ind]['ind']);

					output(['item-'+item_ind,
							'partner_episode',
						    self.yevent_data[event_ind]['start_time'],
						    self.yevent_data[event_ind]['end_time'],
							self.yevent_data[event_ind]['duration']
					]);

					item = self.items[item_ind];
					active_item = item;
					item.episode['start_time'] = timestamp() - block_start_time;
					item.duration = Number(self.yevent_data[event_ind]['duration']) - item.framedelay;
					item.frame_on();
					item.listen_yoked();
					setTimeout(function() {
						item.study();
					}, item.framedelay);

				}, self.yevent_data[i]['start_time']);
				timeouts.push(to);

			};
		};

		// start the timer
		to = setTimeout(function() {
			clear_timeouts();

			if (active_item) active_item.unstudy(exp.study);
			else exp.study();
		}, STUDY_DURATION);
		timeouts.push(to);

	};

	self.listen_for_selection = function() {

		var responded = false;

		if (self.study_cond=='active') {
			self.above_stage.html('Turn '+(trial+1)+'/'+N_STUDY_TRIALS+'<br />Which person do you want to learn about?');
		} else if (self.study_cond=='yoked') {
			self.above_stage.html('Turn '+(trial+1)+'/'+N_STUDY_TRIALS+'<br />Click on the highlighted face to learn about that person:');
		}

		// listen for any clicks
		$('#stagesvg').on(SELECT_EVENT, function(ev) {

			if (!responded) {
			// find which item is active
				$.each(self.items, function(i, item) {

					if (item.row==0 && item.active) {

						responded = true;
						self.above_stage.style('visibility', 'hidden');
						$.each(self.items, function(i, item) { item.unlisten(); });

						// record the item that was chosen
						sampled_options[block][trial] = item.stimid;
						output(['selection', item.col, 'id='+item.stimid])
						self.show_associate(i, item);

					}
				});
			}

		});

	}


	self.show_associate = function(i, item) {

		if (i==0) {
			self.items[i+1].object_off();
			self.items[i+1].frame_off();
		} else if (i==1) {
			self.items[i-1].object_off();
			self.items[i-1].frame_off();
		}


		if (TASK_COND=='PA') {
			rel = 'is partnered with'
		} else if (TASK_COND=='TI') {
			rel = 'is supervised by'
		}

		var h = self.y_off + self.item_h/2;

		self.rel = self.stage.append('text')
							.text(rel)
							.attr('x', 400)
							.attr('y', h + item.col*self.item_h - 10)
							.attr('text-anchor', 'middle')
							.style('font-size', '1em')
							.style('font-family', 'Helvetica')
							.attr('opacity', 0)


		// the image
		self.arrow = self.stage.append('image')
							.attr('x', 350)
							.attr('y', h + item.col*self.item_h)
							.attr('width', 100)
							.attr('height', 50)
							.attr('xlink:href', 'static/images/arrow_right.png')
							.attr('opacity', 0);

		self.arrow.attr('opacity', 1);
		self.rel.attr('opacity', 1);
		self.items[i+2].object_on();
		self.items[i+2].frame_on();

		output(['show_associate', 'id='+self.items[i+2].stimid]);

		to = setTimeout(function() {
			clear_timeouts();
			exp.study();
		}, STUDY_DURATION);
		timeouts.push(to);

	}

	// short ITI
	to = setTimeout(function() {
		clear_timeouts();
		self.study();
	}, 500);
	timeouts.push(to);

};


var PATestTrial = function(block, trial) {
	var self = this;
	active_item = undefined;
	outpfx =['test', trial];

	psiTurk.showPage('stage.html');
	self.above_stage = d3.select("#aboveStage");
	self.stage = d3.select('#stagesvg');
	self.stage.attr('width', STAGE_WIDTH);
	self.stage.attr('height', STAGE_HEIGHT);

	self.items = [];
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = self.stage_h; // square
	self.nrow = 2;
	self.ncol = 2;
	self.item_w = (self.stage_w - 100) / self.nrow;
	self.item_h = (self.stage_h - 40) / self.ncol;

	self.x_off = (Number(self.stage.attr("width")) - self.stage_w) / 2;

	self.target_ind = null;

	//self.study_cond = (SEED) ? 'active' : STUDY_COND[block % 2];
	self.study_cond = STUDY_COND[block];
	if (self.study_cond == 'active') {
		IMAGES = IMAGES_ACTIVE;
		NAMES = NAMES_ACTIVE;
	} else {
		IMAGES = IMAGES_YOKED;
		NAMES = NAMES_YOKED;
		//self.yevent_ind = -1;
		//self.yevent_data = yokeddata[Math.floor(block/2)]['episodes'];
	}


	var ind = range(8).sample(1);
	pair = shuffle([stimuli[block][ind*2], stimuli[block][ind*2+1]]);
	cue = pair[0];
	target = pair[1];
	foil = _.difference(stimuli[block], pair).sample(1);


	self.cue = new Item({'stage': self.stage,
						 'id': cue,
						 'ind': -1,
						 'row': 0,
						 'col': .5,
						 'y_off': self.y_off,
						 'x_off': self.x_off,
						 'width': self.item_w,
						 'height': self.item_h,
						 'image': IMAGES[cue],
						 'framedelay': STUDY_FRAME_DELAY,
						 'duration': STUDY_DURATION,
						 'cond': self.study_cond
						 })
	self.cue.object_on();
	self.cue.frame_on();


	self.target = new Item({'stage': self.stage,
						    'id': target,
						    'ind': 0,
							'row': 1,
							'col': 0,
							'y_off': self.y_off,
							'x_off': self.x_off,
							'width': self.item_w,
							'height': self.item_h,
							'image': IMAGES[target],
							'framedelay': STUDY_FRAME_DELAY,
							'duration': STUDY_DURATION,
							'cond': self.study_cond
							})
	self.target.object_on();
	self.target.frame_inactive();

	self.foil = new Item({'stage': self.stage,
						  'id': foil,
						  'ind': 1,
						  'row': 1,
						  'col': 1,
						  'y_off': self.y_off,
						  'x_off': self.x_off,
						  'width': self.item_w,
						  'height': self.item_h,
						  'image': IMAGES[foil],
						  'framedelay': STUDY_FRAME_DELAY,
						  'duration': STUDY_DURATION,
						  'cond': self.study_cond
						  })
	self.foil.object_on();
	self.foil.frame_inactive();


	self.record_response = function(selected) {
		var stimid = selected;
		var correct = (selected===target) ? 1 : 0;
		test_accuracy[block].push(correct);
		output(['response', 'id='+target, 'id='+foil, 'id='+selected, correct]);

		// self.next();
		setTimeout(function() { exp.test(); }, 200);
	}


	// listen for response
	self.above_stage.html('Who is on the same team as the person on the left?')
	self.target.listen_test(self.record_response);

};



var TITestTrial = function(block, trial) {
	var self = this;
	active_item = undefined;

	//self.study_cond = (SEED) ? 'active' : STUDY_COND[block % 2];
	self.study_cond = STUDY_COND[block];
	if (self.study_cond == 'active') {
		IMAGES = IMAGES_ACTIVE;
		NAMES = NAMES_ACTIVE;
	} else {
		IMAGES = IMAGES_YOKED;
		NAMES = NAMES_YOKED;
		//self.yevent_ind = -1;
		//self.yevent_data = yokeddata[Math.floor(block/2)]['episodes'];
	}
	outpfx =['test', block, self.study_cond, trial];

	psiTurk.showPage('stage.html');
	self.above_stage = d3.select("#aboveStage");
	self.stage = d3.select('#stagesvg');
	self.stage.attr('width', STAGE_WIDTH);
	self.stage.attr('height', STAGE_HEIGHT);

	self.stage.style('visibility', 'hidden')

	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = self.stage_h; // square
	self.nrow = 2;
	self.ncol = 2;
	self.item_w = (self.stage_w - 100) / self.nrow;
	self.item_h = (self.stage_h - 40) / self.ncol;
	self.x_off = (Number(self.stage.attr("width")) - self.stage_w) / 2;
	self.target_ind = null;


	self.pair = testitems[block][trial];
	self.lower_stimid = self.pair[0];
	self.higher_stimid = self.pair[1];
	output(['options', 'lower='+self.lower_stimid, 'higher='+self.higher_stimid]);

	self.test = function() {

		self.above_stage.html('Who is ranked higher in the company?')

		// randomize which side
		if (Math.random() < .5) {
			pos = [0, 1];
		} else {
			pos = [1, 0];
		}
		output(['position', 'id='+self.lower_stimid, pos[0]]);
		output(['position', 'id='+self.higher_stimid, pos[1]]);

		self.lower = new Item({'stage': self.stage,
							'id': self.lower_stimid,
							'ind': 0,
							'row': pos[0],
							'col': .5,
							'y_off': self.y_off,
							'x_off': self.x_off,
							'width': self.item_w,
							'height': self.item_h,
							'image': IMAGES[self.lower_stimid],
							'framedelay': STUDY_FRAME_DELAY,
							'duration': STUDY_DURATION,
							'name': NAMES[self.lower_stimid]
							})


		self.higher = new Item({'stage': self.stage,
								'id': self.higher_stimid,
								'ind': 1,
								'row': pos[1],
								'col': .5,
								'y_off': self.y_off,
								'x_off': self.x_off,
								'width': self.item_w,
								'height': self.item_h,
								'image': IMAGES[self.higher_stimid],
								'framedelay': STUDY_FRAME_DELAY,
								'duration': STUDY_DURATION,
								'name': NAMES[self.higher_stimid]
								})

		self.lower.object_on();
		self.lower.frame_inactive();

		self.higher.object_on();
		self.higher.frame_inactive();

		// listen for response
		self.lower.listen_test(self.record_response);
		self.higher.listen_test(self.record_response);
		output(['listen_for_response']);
		setTimeout(function() {
			self.stage.style('visibility', 'visible');
		}, 200);

	};

	self.record_response = function(selected) {
		var stimid = selected;
		var correct = (selected===self.higher_stimid) ? 1 : 0;
		test_accuracy[block].push(correct);
		output(['response', 'id='+self.lower_stimid, 'id='+self.higher_stimid, 'id='+selected, correct]);

		// self.next();
		setTimeout(function() { exp.test(); }, 200);
	}

	// short ITI
	to = setTimeout(function() {
		clear_timeouts();
		self.test();
	}, 500);
	timeouts.push(to);

};

var Break = function(callback) {
	psiTurk.showPage('stage.html');

	$('#aboveStage').html('Nice job! Before continuing to the next round, '+
						  'take a break for a few minutes. Please sit quietly '+
						  'and take this opportunity to rest your eyes. When ' +
						  'the countdown completes the next round will begin.');
	display = $('#stage');
	display.css('font-size', '3em');
	startTimer(BREAK_DURATION, display, callback);
}


var PostQuestionnaire = function() {
	$('#main').html('');
	var self = this;
	psiTurk.showPage('postquestionnaire.html');
	//self.div = $('#container-instructions');
	//var t = '';
	//self.div.append(instruction_text_element(t));

	record_responses = function() {

		psiTurk.recordTrialData(['postquestionnaire', 'submit']);

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		Summary();
	};

	$("#btn-submit").click(function() {
		record_responses();
	});

};


var Summary = function() {
	var self = this;

	outpfx =['summary'];
	accuracy_block1 = _.reduce(test_accuracy[0], function(a,b) { return a + b; });
	accuracy_block2 = _.reduce(test_accuracy[1], function(a,b) { return a + b; });

	accuracy_pct_block1 = accuracy_block1/N_TEST_TRIALS;
	accuracy_pct_block2 = accuracy_block2/N_TEST_TRIALS;
	accuracy_pct_combined = (accuracy_block1 + accuracy_block2)/(N_TEST_TRIALS*2);

	output(['accuracy_block1', accuracy_block1, accuracy_pct_block1]);
	output(['accuracy_block2', accuracy_block2, accuracy_pct_block2]);
	output(['accuracy_combined', accuracy_block1+accuracy_block2, accuracy_pct_combined]);
	output(['COMPLETE']);
	psiTurk.saveData();

	setTimeout(function() {
		psiTurk.showPage('summary.html');
		$('#partid').html(ids[0]);
		$('#acc_round1').html(Number(accuracy_pct_block1).toFixed(2)*100 +'%');
		$('#acc_round2').html(Number(accuracy_pct_block2).toFixed(2)*100 +'%');
		$('#acc_combined').html(Number(accuracy_pct_combined).toFixed(2)*100 +'%');
		$('#check-button').hide();
		//$('#check-button').on('click', function(e) {
		//	Exit();
		//});
	}, 1000);

};


var Exit = function() {
	psiTurk.completeHIT();
};


var Experiment = function(counterbalance) {
	var self = this;
	self.blocknum = -1;
	self.studytrial = -1;
	self.testtrial = -2;

	if (!RETEST) {
		if (counterbalance==0) {
			STUDY_COND = ['active', 'yoked'];
			IMAGE_TYPE = ['men', 'women'];
			IMAGES_ACTIVE = IMAGES_MEN;
			IMAGES_YOKED = IMAGES_WOMEN;
			NAMES_ACTIVE = shuffle(NAMES_MEN);
			NAMES_YOKED = shuffle(NAMES_WOMEN);

		} else if (counterbalance==1) {
			STUDY_COND = ['active', 'yoked'];
			IMAGE_TYPE = ['women', 'men'];
			IMAGES_ACTIVE = IMAGES_WOMEN;
			IMAGES_YOKED = IMAGES_MEN;
			NAMES_ACTIVE = shuffle(NAMES_WOMEN);
			NAMES_YOKED = shuffle(NAMES_MEN);

		} else if (counterbalance==2) {
			STUDY_COND = ['yoked', 'active'];
			IMAGE_TYPE = ['men', 'women'];
			IMAGES_ACTIVE = IMAGES_WOMEN;
			IMAGES_YOKED = IMAGES_MEN;
			NAMES_ACTIVE = shuffle(NAMES_WOMEN);
			NAMES_YOKED = shuffle(NAMES_MEN);

		} else if (counterbalance==3) {
			STUDY_COND = ['yoked', 'active'];
			IMAGE_TYPE = ['women', 'men'];
			IMAGES_ACTIVE = IMAGES_MEN;
			IMAGES_YOKED = IMAGES_WOMEN;
			NAMES_ACTIVE = shuffle(NAMES_MEN);
			NAMES_YOKED = shuffle(NAMES_WOMEN);

		}
	} else {

		// not implemented
		NAMES_ACTIVE = shuffle(NAMES_MEN);
		NAMES_YOKED = shuffle(NAMES_WOMEN);
	}



	output(['version', version]);
	output(['participantid', ids[0]]);
	output(['partnerid', ids[1]]);
	output(['condition', condition]);
	output(['counterbalance', counterbalance]);
	output(['task_cond', TASK_COND]);
	output(['study_cond', STUDY_COND[0], STUDY_COND[1]]);
	output(['image_type', IMAGE_TYPE[0], IMAGE_TYPE[1]]);

	self.begin = function() {

		if (!SKIP_INSTRUCTIONS) {
			if (RETEST) {
				InstructionsRetest();
			} else {
				Instructions1();
			}
		} else {
			self.begin_block();
		}
	}


	self.begin_block = function() {
		if (SAVEDATA) psiTurk.saveData();
		self.studytrial = -1;
		self.testtrial = -2;
		self.blocknum += 1;

		if (self.blocknum < N_BLOCKS) {

			if (RETEST) {
				self.test();
			} else {
				self.studycond = STUDY_COND[self.blocknum];
				if (self.studycond=='active') {
					InstructionsActiveBlock();
				} else if (self.studycond=='yoked') {
					InstructionsYokedBlock();
				} else {
					self.study();
				}
			}

		} else {
			if (RETEST) {
				Summary();
			} else {
				PostQuestionnaire();
			}
		}
	}


	self.study = function() {
		self.studytrial += 1;
		if (self.studytrial < N_STUDY_TRIALS) {
			self.view = new StudyTrial(self.blocknum, self.studytrial);
		} else {
			self.test();
		}
	}


	self.test = function() {
		if (SAVEDATA) psiTurk.saveData();
		self.testtrial += 1;
		if (self.testtrial==-1) {
			InstructionsTest(self.blocknum);
		} else if (self.testtrial < N_TEST_TRIALS) {
			if (TASK_COND=='PA') {
				self.view = new PATestTrial(self.blocknum, self.testtrial);
			} else if (TASK_COND=='TI') {
				self.view = new TITestTrial(self.blocknum, self.testtrial);
			}
		} else {
			if (self.blocknum < (N_BLOCKS - 1)) {
				self.view = new Break(self.begin_block);
			} else {
				self.begin_block();
			}
		}

	};


	// STIMULI SETUP

	// study data from yoked partner
	if (partner_result.length != []) {
		$.each(partner_result.partner_data, function(i, d) {
			var td = d.trialdata;
			if (td[0] == "study") {
				if (td[3] == "item" || td[4] == "episode" || td[3]== "preexpose_ind") {
					partnerdata.push(td);
				};
			}
		})
	}

	yokeddata = [];
	yokeditems = [];

	if (!SEED) {

		for (var b=0; b<4; b++) {
			blockdata = _.filter(partnerdata, function(d) { return d[1] == b; })
			itemdata = _.filter(blockdata, function(d) { return d[3] == 'item' })
			episodedata = _.filter(blockdata, function(d) { return d[4] == 'episode' })
			yokeddata[b] = {'condition': blockdata[0][2],
							'items': [],
							'episodes': []};

			$.each(itemdata, function(i, d) {
				stimid = Number(d[4].split('=')[1]);
				ind = Number(d[5].split('=')[1]);
				yokeddata[b]['items'][ind] = stimid;
			})

			$.each(episodedata, function(i, d) {
				yokeddata[b]['episodes'].push(
					{'ind': d[3].split('-')[1],
					 'start_time': d[5],
					 'end_time': d[6],
					 'duration': d[7]}
				);
			})

		}

		// randomize the order in which yoked blocks are seen
		yokeddata = shuffle(_.filter(yokeddata, function(d) { return d['condition'] == 'active'; })).sample(2);
		$.each(yokeddata, function(i, d) {
			yokeditems = yokeditems.concat(d['items']);
		})

	};
	remaining = _.difference(range(IMAGES_MEN.length), yokeditems);


	if (TASK_COND=='PA') {
		N_ITEMS = 16;
	} else if (TASK_COND=='TI') {
		N_ITEMS = 9;
	}


	if (!RETEST) {

		activeitems = shuffle(range(IMAGES_ACTIVE.length).sample(N_ITEMS));
		yokeditems  = shuffle(range(IMAGES_YOKED.length).sample(N_ITEMS));

		if (STUDY_COND[0]=='active') {
			stimuli = [activeitems, yokeditems];
		} else {
			stimuli = [yokeditems, activeitems];
		}

		testitems = [sample_test_trials_TI(0), sample_test_trials_TI(1)];


	} else {
		activeitems = _.filter(prev_test_data, function(row) { return row[0]=='activeitems'})[0].slice(1,10)
		yokeditems = _.filter(prev_test_data, function(row) { return row[0]=='yokeditems'})[0].slice(1,10)

		if (STUDY_COND[0]=='active') {
			stimuli = [activeitems, yokeditems];
		} else {
			stimuli = [yokeditems, activeitems];
		}


		testitems0 = _.filter(prev_test_data, function(row) { return row[0]=='testitems'})[0].slice(3,76);
		testitems1 = _.filter(prev_test_data, function(row) { return row[0]=='testitems'})[1].slice(3,76);
		testitems = [shuffle(testitems0), shuffle(testitems1)];

	}

	output(['activeitems'].concat(activeitems));
	output(['yokeditems'].concat(yokeditems));

	output(['activeimages'].concat(_.map(activeitems, function(stimid) { return IMAGES_ACTIVE[stimid]; })));
	output(['yokedimages'].concat(_.map(yokeditems, function(stimid) { return IMAGES_YOKED[stimid]; })));

	output(['activenames'].concat(_.map(activeitems, function(stimid) { return NAMES_ACTIVE[stimid]; })));
	output(['yokednames'].concat(_.map(yokeditems, function(stimid) { return NAMES_YOKED[stimid]; })));

	output(['testitems', 0, STUDY_COND[0]].concat(testitems[0]));
	output(['testitems', 1, STUDY_COND[1]].concat(testitems[1]));

	if (N_TEST_TRIALS===undefined) {
		N_TEST_TRIALS = testitems[0].length;
	}

	self.begin();
};

// vi: noexpandtab tabstop=4 shiftwidth=4
