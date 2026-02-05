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
      $("#ex1_slider").removeClass("moved");

      this.moved = false;
      $("#ex1_slider")
        .off("input")
        .on("input", () => {
          this.moved = true;
          $("#ex1_slider").addClass("moved");
        });
    },

    button: function () {
      var v = parseInt($("#ex1_slider").val(), 10);

      if (!this.moved || v === 4) {
        $("#example1 .err")
          .text(
            "Move the slider toward the continuation that sounds more natural to you. The further you move the slider to the side, the more natural that option sounds compared to the other."
          )
          .show();
        return;
      }

      if (v >= 5) {
        $("#example1 .err")
          .text("Not quite. In this example, continuation A is more natural because it is more related to the original sentence by adding relevant information, whereas B is less directly related. Please try again.")
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
      $("#ex2_slider").removeClass("moved");

      this.moved = false;
      $("#ex2_slider")
        .off("input")
        .on("input", () => {
          this.moved = true;
          $("#ex2_slider").addClass("moved");
        });
    },

    button: function () {
      var v = parseInt($("#ex2_slider").val(), 10);

      if (!this.moved || v === 4) {
        $("#example2 .err")
          .text(
            "Move the slider toward the continuation that sounds more natural to you. The further you move the slider to the side, the more natural that option sounds compared to the other."
          )
          .show();
        return;
      }

      if (v >= 5) {
        $("#example2 .err")
          .text("Not quite. In this example, continuation A is more natural because it is more related to the original sentence by adding relevant information, whereas B is less directly related. Please try again.")
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
      $("#trial_slider").removeClass("moved");

      this.moved = false;
      $("#trial_slider")
        .off("input")
        .on("input", () => {
          this.moved = true;
          $("#trial_slider").addClass("moved");
        });

      $("#trial-sentence").html(stim.Sentence);

      var opts = _.shuffle([
        { key: "C1", text: stim.C1 },
        { key: "C2", text: stim.C2 }
      ]);

      this.A_key = opts[0].key;
      this.B_key = opts[1].key;

      $("#A_text").html(opts[0].text);
      $("#B_text").html(opts[1].text);
    },

    button: function () {
      var v = parseInt($("#trial_slider").val(), 10);

      if (!this.moved) {
        $(".err").show();
        return;
      }

      var rt_ms = Date.now() - this.startTime;

      // Which side did the participant choose?
      var chosen_option =
        v <= 3 ? "A" :
        v >= 5 ? "B" :
        "NEUTRAL";

      // Which continuation key corresponds to that side?
      var chosen_key =
        chosen_option === "A" ? this.A_key :
        chosen_option === "B" ? this.B_key :
        "NEUTRAL";

      // Store the chosen text (or null for NEUTRAL)
      var chosen_text =
        chosen_key === "C1" ? this.stim.C1 :
        chosen_key === "C2" ? this.stim.C2 :
        null;

      // =====================================================
      // NEW: map response to -3..+3 relative to expected choice
      // =====================================================

      // "Expected/wanted" continuation key for this item:
      // - If your stimuli define it (e.g., ExpectedKey), use that.
      // - Otherwise default to C1.
      var expected_key =
        this.stim.ExpectedKey || this.stim.Expected ||
          ((this.stim.Type === "critical" && this.stim.Variant === "neutral")
          ? "C2"
          : "C1");


      // Where the expected continuation appears on this trial (A or B)
      var expected_option =
        expected_key === this.A_key ? "A" :
        expected_key === this.B_key ? "B" :
        null;

      // Raw signed distance from midpoint: A negative, B positive
      var raw_score = v - 4; // {1..7} -> {-3..+3}

      // Flip sign so that + always means "toward expected"
      var score_rel_expected =
        expected_option === "A" ? -raw_score :
        expected_option === "B" ?  raw_score :
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

        A_key: this.A_key,
        B_key: this.B_key,

        slider_value: v,

        // NEW saved variables
        raw_score: raw_score,                     // -3..+3 (A neg, B pos)
        expected_key: expected_key,               // usually "C1"
        expected_option: expected_option,         // "A" or "B"
        score_rel_expected: score_rel_expected,   // -3..+3 where + = expected

        chosen_option: chosen_option,
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

  var critical = all_stims.filter(function (s) {
    return s.Type === "critical" && Number(s.List) === exp.list;
  });

  var fillers = all_stims.filter(function (s) {
    return s.Type === "filler";
  });

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

  exp.structure = ["i0", "example1", "example2", "startExp", "trial", "subj_info", "thanks"];

  exp.slides = make_slides(exp);
  exp.nQs = utils.get_exp_length();

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

  hideAllSlidesForce();

  var _orig_go = exp.go.bind(exp);
  exp.go = function () {
    hideAllSlidesForce();
    _orig_go();

    var shown = window._s && window._s.name ? window._s.name : exp.structure[0];
    showSlideForce(shown);
  };

  $("#start_button").off("click").on("click", function () {
    exp.go();
  });

  exp.go();
}
