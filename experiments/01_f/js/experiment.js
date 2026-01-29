/* =====================================================
   experiment.js — Likert slider (7-point), midpoint allowed,
   slider turns blue after moving, and ONLY the current slide shows.
===================================================== */

function make_slides(f) {
  var slides = {};

  /* -------------------------
     INTRO
  ------------------------- */
  slides.i0 = slide({
    name: "i0",
    start: function () {
      exp.startT = Date.now();
    }
  });

  /* =====================================================
     EXAMPLE 1
     Correct continuation = LEFT
     Now midpoint (4) is allowed:
       - Accept: 1–4
       - Reject: 5–7
     Must move slider at least once.
  ===================================================== */
  slides.example1 = slide({
    name: "example1",

    start: function () {
      $("#example1 .err").hide().css("color", "red");

      this.moved = false;

      $("#ex1_slider")
        .val(4)
        .removeClass("moved")
        .off("input")
        .on("input", () => {
          this.moved = true;
          $("#ex1_slider").addClass("moved");
        });
    },

    button: function () {
      var v = parseInt($("#ex1_slider").val(), 10);

      if (!this.moved) {
        $("#example1 .err")
          .text("Please move the slider to make a selection.")
          .show();
        return;
      }

      // correct is LEFT => accept 1–4, reject 5–7
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

  /* =====================================================
     EXAMPLE 2
     Correct continuation = LEFT
     Midpoint allowed:
       - Accept: 1–4
       - Reject: 5–7
     Must move slider at least once.
  ===================================================== */
  slides.example2 = slide({
    name: "example2",

    start: function () {
      $("#example2 .err").hide().css("color", "red");

      this.moved = false;

      $("#ex2_slider")
        .val(4)
        .removeClass("moved")
        .off("input")
        .on("input", () => {
          this.moved = true;
          $("#ex2_slider").addClass("moved");
        });
    },

    button: function () {
      var v = parseInt($("#ex2_slider").val(), 10);

      if (!this.moved) {
        $("#example2 .err")
          .text("Please move the slider to make a selection.")
          .show();
        return;
      }

      // correct is LEFT => accept 1–4, reject 5–7
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

  /* -------------------------
     START EXPERIMENT
  ------------------------- */
  slides.startExp = slide({
    name: "startExp",
    button: function () {
      exp.go();
    }
  });

  /* =====================================================
     MAIN TRIAL SLIDE (LIKERT)
     - Midpoint (4) allowed
     - Must move slider at least once
     - Slider turns blue after moving (.moved class)
     - If 4 chosen => chosen_side="mid", chosen_key/text = null
  ===================================================== */
  slides.trial = slide({
    name: "trial",
    present: exp.stimuli,

    present_handle: function (stim) {
      // Hide any visible error text
      $("#trial .err").hide();

      this.stim = stim;
      this.startTime = Date.now();

      // Reset feedback
      $("#trial_feedback").val("");

      // Reset slider
      this.moved = false;
      $("#trial_slider")
        .val(4)
        .removeClass("moved")
        .off("input")
        .on("input", () => {
          this.moved = true;
          $("#trial_slider").addClass("moved");
        });

      // Insert sentence
      $("#trial-sentence").html(stim.Sentence);

      // Shuffle which continuation appears LEFT vs RIGHT
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

      if (!this.moved) {
        $("#trial .err").text("Please move the slider to make a selection.").show();
        return;
      }

      var rt_ms = Date.now() - this.startTime;

      var chosen_side =
        (v <= 3) ? "left" :
        (v >= 5) ? "right" :
        "mid";

      var chosen_key =
        (chosen_side === "left") ? this.left_key :
        (chosen_side === "right") ? this.right_key :
        null;

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

        slider_value: v,            // 1..7
        chosen_side: chosen_side,   // left / mid / right
        chosen_key: chosen_key,     // C1 / C2 / null if mid
        chosen_text: chosen_text,   // text or null if mid

        rt_ms: rt_ms,
        item_feedback: $("#trial_feedback").val()
      });

      // Advance
      _stream.apply(this);
    }
  });

  /* -------------------------
     SUBJECT INFO
  ------------------------- */
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

  /* -------------------------
     THANKS + SUBMIT
  ------------------------- */
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

/* =====================================================
   INIT — includes robust slide show/hide so only current slide is visible
===================================================== */
function init() {
  exp.trials = [];
  exp.catch_trials = [];
  exp.data_trials = [];

  // --- list assignment via URL param "cond", else random fallback
  var condition = new URLSearchParams(window.location.search).get("cond");
  condition = condition === null ? NaN : parseInt(condition, 10);

  if (!isNaN(condition) && condition >= 1 && condition <= 15) {
    exp.list = condition;
  } else {
    exp.list = _.sample([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
  }

  // --- select stims for assigned list
  var critical = all_stims.filter(function (s) {
    return s.Type === "critical" && Number(s.List) === exp.list;
  });

  var fillers = all_stims.filter(function (s) {
    return s.Type === "filler";
  });

  // --- shuffle order
  exp.stimuli = _.shuffle(critical.concat(fillers));
  exp.n_trials = exp.stimuli.length;

  // --- system info
  exp.system = {
    Browser: BrowserDetect.browser,
    OS: BrowserDetect.OS,
    screenH: screen.height,
    screenUH: exp.height,
    screenW: screen.width,
    screenUW: exp.width
  };

  // --- experiment flow
  exp.structure = [
    "i0",
    "example1",
    "example2",
    "startExp",
    "trial",
    "subj_info",
    "thanks"
  ];

  // --- build slides
  exp.slides = make_slides(exp);
  exp.nQs = utils.get_exp_length();

  /* ======================================================
     FORCE SHOW/HIDE (overrides any CSS display !important)
  ======================================================= */
  function hideAllSlidesForce() {
    document.querySelectorAll(".slide").forEach(function (el) {
      el.style.setProperty("display", "none", "important");
    });
  }

  function showSlideForce(id) {
    hideAllSlidesForce();
    var el = document.getElementById(id);
    if (el) el.style.setProperty("display", "block", "important");
  }

  // Hide everything immediately
  hideAllSlidesForce();

  // Wrap exp.go so EVERY transition ends with exactly one visible slide
  var _orig_go = exp.go.bind(exp);
  exp.go = function () {
    hideAllSlidesForce();  // clean slate
    _orig_go();

    // cocolab convention: currently shown slide = structure[phase - 1]
    var shown = exp.structure[exp.phase - 1] || exp.structure[0];
    showSlideForce(shown);
  };

  // Start button: advance from i0 -> example1
  $("#start_button").off("click").on("click", function () {
    exp.go();
  });

  // Show ONLY the intro slide on load
  exp.go();
}
