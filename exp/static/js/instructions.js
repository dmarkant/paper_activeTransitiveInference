instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};

instruction_image_element = function(pth, width, height, fl) {
    if (fl) {
        return '<img src='+pth+' width='+width+' height='+height+' style="display:inline; margin-right:5px">';
    } else {
        return '<center><img src='+pth+' width='+width+' height='+height+'></center>';
    }
};


svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


function add_next_instruction_button(target) {
    $('#buttons').append('<button id=btn-continue class="btn btn-default btn-lg">Continue</button>');

    $('#btn-continue').on('click', function() {
        $(window).unbind('keydown');
        target();
    });

};


function init_instruction(obj, id) {
	obj.id = id;
	output(['instructions', id]);

	psiTurk.showPage('instruct.html');
	obj.div = $('#container-instructions');

	obj.add_text = function(t) {
		obj.div.append(instruction_text_element(t));
	};

    obj.add_image = function(pth, w, h, fl) {
        obj.div.append(instruction_image_element(pth, w, h, fl));
    };

	return obj;
};


var Instructions1 = function() {
	var self = init_instruction(this, 1);

    self.add_text('Welcome! In this experiment you will play a game to learn about relationships between ' +
                  'people in a set of fictional companies. Each person will be represented by a picture '+
                  'of their face.');

    self.add_text('There will be two rounds in the game. In the first part of each round, '+
                  'you will learn about the relationship between pairs of people in a company.');

    if (TASK_COND=='PA') {
        self.add_text('For example, you might learn that the two people pictured below are on the ' +
                    'same team:');
        self.add_image('static/images/study_example_PA.png', 644, 290);

    } else if (TASK_COND=='TI') {

        self.add_text('For example, you might first learn that the person on the left, Abby, is directly supervised by '+
                      'the person on the right, Bill:');
        self.add_image('static/images/study_example_TI.png', 570, 290);

        self.add_text('You might then learn that Bill is supervised by a third person, Carla:');
        self.add_image('static/images/study_example_TI_2.png', 570, 290);

        self.add_text('After you have spent some time learning about people in this way, you will '+
                      'be tested on the relationships between different people in the company. For example, ' +
                      'based on what you were shown above, who ranks higher in the company, Abby or Carla?');

        self.div.append('<button id=btn-A class="btn btn-default btn-lg" style="margin: 30px">Abby</button>')
        self.div.append('<button id=btn-C class="btn btn-default btn-lg">Carla</button>')

        self.div.append('<p id=fdbk style="color:red; font-style: italic; visibility: hidden; margin-left: 30px;">No, try again...</p>')

        $('#btn-A').on('click', function(e) { $('#fdbk').css('visibility', 'visible')})
        $('#btn-C').on('click', Instructions2);

    }


};


var Instructions2 = function() {
	var self = init_instruction(this, 1);

    self.add_text('Good job. If you correctly recall most of the relationships during the tests, you will ' +
                  'earn a monetary reward. So try your best during the learning phase of each '+
                  'round to learn about how people in the company are related to each other!');


	add_next_instruction_button(function() { exp.begin_block(); });
};


var InstructionsActiveBlock = function() {
	var self = init_instruction(this, 1);


    self.add_text('You are about to begin the next round of the game. In this round, you will ' +
                  'learn about the relationships between people in Company X. All of the people ' +
                  'in the company are shown below:');

    tmpitems = shuffle(range(activeitems.length));
    s = '<div class="display:block;">';
    for (var i=0; i < activeitems.length; i++) {
        ind = tmpitems[i];
        s += instruction_image_element(IMAGES_ACTIVE[activeitems[ind]], 82, 100, true);
    }
    s += '</div>';


    self.div.append(s);

    if (TASK_COND=='PA') {

        self.add_text('In the learning phase of this round, you will try to memorize which pairs of ' +
                    'people are on the same team. At each step, you will be shown two people from ' +
                    'the company, and will choose one person to reveal their team member.');

        self.add_text('You will have '+N_STUDY_TRIALS+' turns to learn which people are on the same '+
                      'teams in the company. Then you will be tested for how well you have learned ' +
                      'the relationships between people in the company.');

    } else if (TASK_COND=='TI') {

        self.add_text('In the learning phase of this round, you will try to memorize how people '+
                      'rank within the company. At each step, you will be shown two people from ' +
                      'the company, and will choose one person to reveal who they report to (that is, '+
                      'their direct supervisor). <b>Your goal ' +
                      'is to completely learn the \"chain of command\" for the company, including '+
                      'the relative rank of any two individuals.</b>');

        self.add_text('You will have '+N_STUDY_TRIALS+' turns to learn about the direct superior of ' +
                    'different people in the company. Then you will be tested for how well you have ' +
                    'learned the relationships between people in the company.');

        self.add_text('<b>Although you may find it difficult to remember everything, please do not '+
                      'use any external aids (phone, pen and paper, etc) as that will invalidate the '+
                      'results of this study.</b> Just do your best to learn as much as you can about the '+
                      'chain of command in the available time.');

        self.add_text('If you have any questions please alert the experimenter. Otherwise, press the '+
                      'continue button when you feel ready to begin. Good luck!');

    }

	add_next_instruction_button(function() { exp.study(); });
};


var InstructionsYokedBlock = function() {
	var self = init_instruction(this, 1);

    self.add_text('You are about to begin the next round of the game. In this round, you will ' +
                  'learn about the relationships between people in Company Y. All of the people ' +
                  'in the company are shown below:');


    tmpitems = shuffle(range(yokeditems.length));
    s = '<div class="display:block;">';
    for (var i=0; i < yokeditems.length; i++) {
        ind = tmpitems[i];
        s += instruction_image_element(IMAGES_YOKED[yokeditems[ind]], 82, 100, true);
    }
    s += '</div>';

    self.div.append(s);



    if (TASK_COND=='PA') {
        self.add_text('In the learning phase of this round, you will try to memorize which pairs of ' +
                    'people are on the same team. At each step, you will be shown two people from ' +
                    'the company, then will be shown one person\'s team member.');

        self.add_text('You will have '+N_STUDY_TRIALS+' turns to learn which people are on the same '+
                      'teams in the company. Then you will be tested for how well you have learned ' +
                      'the relationships between people in the company.');
    } else if (TASK_COND=='TI') {

        self.add_text('In the learning phase of this round, you will try to memorize how people '+
                      'rank within the company. At each step, you will be shown two people from ' +
                      'the company, and will be shown one person\'s direct supervisor. <b>Your goal ' +
                      'is to completely learn the \"chain of command\" for the company, including '+
                      'the relative rank of any two individuals.</b>');

        self.add_text('You will have '+N_STUDY_TRIALS+' turns to learn about the direct superior of ' +
                    'a person. Then you will be tested for how well you have learned ' +
                    'the relationships between people in the company.');

        self.add_text('<b>Although you may find it difficult to remember everything, please do not '+
                      'use any external aids (phone, pen and paper, etc) as that will invalidate the '+
                      'results of this study.</b> Just do your best to learn as much as you can about the '+
                      'chain of command in the available time.');

        self.add_text('If you have any questions please alert the experimenter. Otherwise, press the '+
                      'continue button when you feel ready to begin. Good luck!');


    }

	add_next_instruction_button(function() { exp.study(); });
};


var InstructionsTest = function(blocknum) {
	var self = init_instruction(this, 1);

    console.log(blocknum);

    var n = ['first', 'second'][blocknum];

    console.log(n);

    self.add_text('Now you will be tested on what you learned about the people in the '+n+' company. ' +
                  'On the following screens, answer the question at the top of the screen as ' +
                  'quickly as you can while being as accurate as possible. You will be shown ' +
                  'how many questions you answered correctly at the end of the experiment. Good luck!');

	add_next_instruction_button(function() { exp.test(); });
};


var InstructionsRetest = function() {
	var self = init_instruction(this, 1);

    //self.add_text('Welcome back! Last time you were here, you learned about the relationships between ' +
    //              'people in two fictional companies (one made up of women and a second made of up men). ' +
    //              'In this session you will be tested on how much you can remember. As in the last session, you will ' +
    //              'have a chance to earn a payment based on the number of questions that you answer ' +
    //              'correctly, so do your best to respond as accurately as possible.');

    self.add_text('Welcome back! Last time you were here, you learned about the relationships between ' +
                  'people in two fictional companies (one made up of women and a second made of up men). ' +
                  'In this session you will be tested on how much you can remember. As in the last session, ' +
                  'please do your best to respond as accurately as possible.');

    self.add_text('If you have any questions, please alert the experimenter. Otherwise, press the button ' +
                  'below to begin the test when you are ready. Good luck!');

	add_next_instruction_button(function() { exp.begin_block(); });
};

