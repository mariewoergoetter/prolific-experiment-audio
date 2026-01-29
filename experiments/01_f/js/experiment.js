

function make_slides(f) {
  var slides = {};


  slides.i0 = slide({
    name: "i0",
    start: function () {
      exp.startT = Date.now();
    }
  });

  slides.example1 = slide({
    name: "example1",

    start: function () {
      $("#example1 .err").hide().css("color", "red");
      $("#ex1_slider").val(4);

      this.moved = false;
      $("#ex1_slider")
        .off("input")
        .on("input", () => { this.moved = true; });
    },

    button: function () {
      var v = parseInt($("#ex1_slider").val(), 10);

      if (!this.moved || v === 4) {
        $("#example1 .err")
          .text("Please move the slider away from the middle position (4).")
          .show();
        return;
      }

      if (v >= 5) {
        $("#example1 .err")
          .text("Not quite — move the slider toward the more appropriate continuation.")
          .show();
        return;
      }

      $("#example1 .err").hide();
      exp.go();
    }
  });


  slides.example2 = slide({
    name: "example2",

    start: function () {
      $("#example2 .err").hide().css("color", "red");
      $("#ex2_slider").val(4);

      this.moved = false;
      $("#ex2_slider")
        .off("input")
        .on("input", () => { this.moved = true; });
    },

    button: function () {
      var v = parseInt($("#ex2_slider").val(), 10);

      if (!this.moved || v === 4) {
        $("#example2 .err")
          .text("Please move the slider away from the middle position (4).")
          .show();
        return;
      }

      if (v >= 5) {
        $("#example2 .err")
          .text("Not quite — move the slider toward the more appropriate continuation.")
          .show();
        return;
      }

      $("#example2 .err").hide();
      exp.go();
    }
  });


  slides.startExp = slide({
    name: "startExp",
    button: function () {
      exp.go();
    }
  });


  slides.trial = slide({
    name: "trial",
    present: exp.stimuli,

    present_handle: function (stim) {
      $(".err").hide();

      this.stim = stim;
      this.startTime = Date.now();

      $("#trial_feedback").val("");
      $("#trial_slider").val(4);

      this.moved = false;
      $("#trial_slider")
        .off("input")
        .on("input", () => { this.moved = true; });

      $("#trial-sentence").html(stim.Sentence);

     
      var opts = _.shuffle([
        { key: "C1", text: stim.C1 },
        { key: "C2", text: stim.C2 }
      ]);

      this.left_key = opts[0].key;
      this.right_key = opts[1].key;

      $("#left_text").html(opts[0].text);
      $("#right_text").html(opts[1].text);
    },

    button: function () {
      var v = parseInt($("#trial_slider").val(), 10);

      if (!this.moved || v === 4) {
        $(".err").show();
        return;
      }

      var rt_ms = Date.now() - this.startTime;

      var chosen_side = (v <= 3) ? "left" : "right";
      var chosen_key =
        (chosen_side === "left") ? this.left_key : this.right_key;

      var chosen_text =
        (chosen_key === "C1") ? this.stim.C1 :
        (chosen_key === "C2") ? this.stim.C2 :
        null;

      exp.data_trials.push({
        slide_number_in_experiment: exp.phase,

        list_assigned: exp.list,
        item_list: this.stim.List,
        type: this.stim.Type,
        group: this.stim.Group,
        item: this.stim.ItemID,
        variant: this.stim.Variant,
        filler_type: this.stim.FillerType || null,

        sentence: this.stim.Sentence,
        C1: this.stim.C1,
        C2: this.stim.C2,

        left_key: this.left_key,
        right_key: this.right_key,

        slider_value: v,        
        chosen_side: chosen_side, 
        chosen_key: chosen_key, 
        chosen_text: chosen_text,

        rt_ms: rt_ms,
        item_feedback: $("#trial_feedback").val()
      });

      _stream.apply(this);
    }
  });


  slides.subj_info = slide({
    name: "subj_info",

    start: function () {
      $("#language").val("");
      $("#experiment_about").val("");
      $("#comments").val("");
      $("#enjoyment").val("-1");
      $("#fairprice").val("-1");
      $('input[name="assess"]').prop("checked", false);
    },

    submit: function () {
      exp.subj_data = {
        language: $("#language").val(),
        enjoyment: $("#enjoyment").val(),
        assess: $('input[name="assess"]:checked').val(),
        fairprice: $("#fairprice").val(),
        experiment_about: $("#experiment_about").val(),
        comments: $("#comments").val()
      };
      exp.go();
    }
  });


  slides.thanks = slide({
    name: "thanks",

    start: function () {
      exp.data = {
        trials: exp.data_trials,
        catch_trials: exp.catch_trials,
        system: exp.system,
        list_assigned: exp.list,
        subject_information: exp.subj_data,
        time_in_minutes: (Date.now() - exp.startT) / 60000
      };
      proliferate.submit(exp.data);
    }
  });

  return slides;
}


function init() {
  exp.trials = [];
  exp.catch_trials = [];
  exp.data_trials = [];

  var condition = new URLSearchParams(window.location.search).get("cond");
  condition = condition === null ? NaN : parseInt(condition, 10);

  if (!isNaN(condition) && condition >= 1 && condition <= 15) {
    exp.list = condition;
  } else {
    exp.list = _.sample([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
  }

  var critical = all_stims.filter(s =>
    s.Type === "critical" && Number(s.List) === exp.list
  );

  var fillers = all_stims.filter(s =>
    s.Type === "filler"
  );

  exp.stimuli = _.shuffle(critical.concat(fillers));
  exp.n_trials = exp.stimuli.length;

  exp.system = {
    Browser: BrowserDetect.browser,
    OS: BrowserDetect.OS,
    screenH: screen.height,
    screenUH: exp.height,
    screenW: screen.width,
    screenUW: exp.width
  };

  exp.structure = [
    "i0",
    "example1",
    "example2",
    "startExp",
    "trial",
    "subj_info",
    "thanks"
  ];

  exp.slides = make_slides(exp);
  exp.nQs = utils.get_exp_length();

  $(".slide").hide();
  $("#start_button").click(function () { exp.go(); });
  exp.go(); // show i0

  });


}

