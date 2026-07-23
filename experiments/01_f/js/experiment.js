function prepareAudio(options) {
  var audio = document.getElementById(options.audioId);
  var status = $(options.statusSelector);
  var slider = $(options.sliderSelector);

  if (!audio) {
    throw new Error(
      "Could not find audio element: " + options.audioId
    );
  }

  /*
   * Stop any previous playback and reset the player.
   */
  audio.pause();
  audio.currentTime = 0;

  if (options.src) {
    audio.src = options.src;
  }

  audio.load();

  /*
   * Participants cannot answer until the recording has played
   * completely at least once.
   */
  slider.prop("disabled", true);

  var state = {
    played: false,
    finished: false,
    playCount: 0,
    error: false
  };

  status
    .text("Please listen to the complete sentence.")
    .removeClass("audioError");

  audio.onplay = function () {
    state.played = true;
    state.playCount += 1;

    status
      .text("")
      .removeClass("audioError");
  };

  audio.onended = function () {
    state.finished = true;

    status
      .text(
        ""
      )
      .removeClass("audioError");

    slider.prop("disabled", false);
  };

  audio.onerror = function () {
    state.error = true;

    status
      .text(
        "The audio could not be loaded. " +
        "Please check your connection and try again."
      )
      .addClass("audioError");

    slider.prop("disabled", true);
  };

  return {
    audio: audio,
    state: state
  };
}


function stopAudio(audio) {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}


function resetSlider(sliderSelector) {
  var slider = $(sliderSelector);

  slider.val(4);
  slider.removeClass("moved");
  slider.prop("disabled", true);
}


function make_slides(f) {
  var slides = {};


  /*
   * INTRODUCTION
   */
  slides.i0 = slide({
    name: "i0",

    start: function () {
      exp.startT = Date.now();
    }
  });


  /*
   * EXAMPLE 1
   */
  slides.example1 = slide({
    name: "example1",

    start: function () {
      var self = this;

      $("#example1 .err")
        .hide()
        .css("color", "red");

      resetSlider("#ex1_slider");

      this.moved = false;

      this.audioData = prepareAudio({
        audioId: "example1-audio",
        statusSelector: "#example1-audio-status",
        sliderSelector: "#ex1_slider",
        src: "audio_examples/example_01.wav"
      });

      $("#ex1_slider")
        .off("input")
        .on("input", function () {
          self.moved = true;
          $("#ex1_slider").addClass("moved");
        });
    },

    button: function () {
      var v = parseInt(
        $("#ex1_slider").val(),
        10
      );

      if (
        !this.audioData ||
        !this.audioData.state.played ||
        !this.audioData.state.finished
      ) {
        $("#example1 .err")
          .text(
            "Please listen to the complete sentence " +
            "before continuing."
          )
          .show();

        return;
      }

      if (!this.moved || v === 4) {
        $("#example1 .err")
          .text(
            "Please move the slider toward the continuation " +
            "that sounds more natural."
          )
          .show();

        return;
      }

      /*
       * A is on the left, so values 1–3 select A.
       * In this example, A is the intended answer.
       */
      if (v >= 5) {
        $("#example1 .err")
          .text(
            "Not quite. In this example, continuation A is " +
            "more natural because it adds relevant information " +
            "about why the meeting was moved. Please try again."
          )
          .show();

        return;
      }

      $("#example1 .err").hide();

      stopAudio(this.audioData.audio);

      exp.go();
    }
  });


  /*
   * EXAMPLE 2
   */
  slides.example2 = slide({
    name: "example2",

    start: function () {
      var self = this;

      $("#example2 .err")
        .hide()
        .css("color", "red");

      resetSlider("#ex2_slider");

      this.moved = false;

      this.audioData = prepareAudio({
        audioId: "example2-audio",
        statusSelector: "#example2-audio-status",
        sliderSelector: "#ex2_slider",
        src: "audio_examples/example_02.wav"
      });

      $("#ex2_slider")
        .off("input")
        .on("input", function () {
          self.moved = true;
          $("#ex2_slider").addClass("moved");
        });
    },

    button: function () {
      var v = parseInt(
        $("#ex2_slider").val(),
        10
      );

      if (
        !this.audioData ||
        !this.audioData.state.played ||
        !this.audioData.state.finished
      ) {
        $("#example2 .err")
          .text(
            "Please listen to the complete sentence " +
            "before continuing."
          )
          .show();

        return;
      }

      if (!this.moved || v === 4) {
        $("#example2 .err")
          .text(
            "Please move the slider toward the continuation " +
            "that sounds more natural."
          )
          .show();

        return;
      }

      /*
       * A is on the left, so values 1–3 select A.
       * In this example, A is the intended answer.
       */
      if (v >= 5) {
        $("#example2 .err")
          .text(
            "Not quite. In this example, continuation A is " +
            "more natural because it explains why the library " +
            "closed early. Please try again."
          )
          .show();

        return;
      }

      $("#example2 .err").hide();

      stopAudio(this.audioData.audio);

      exp.go();
    }
  });


  /*
   * START OF MAIN EXPERIMENT
   */
  slides.startExp = slide({
    name: "startExp",

    button: function () {
      exp.go();
    }
  });


  /*
   * MAIN TRIALS
   */
  slides.trial = slide({
    name: "trial",

    present: exp.stimuli,

    present_handle: function (stim) {
      var self = this;

      $("#trial .err")
        .hide()
        .css("color", "red");

      this.stim = stim;
      this.startTime = Date.now();
      this.moved = false;

      $("#trial_feedback").val("");

      resetSlider("#trial_slider");

      $("#trial_slider")
        .off("input")
        .on("input", function () {
          self.moved = true;
          $("#trial_slider").addClass("moved");
        });

      /*
       * Load the neutral, focus, or filler recording supplied
       * by stimuli.js.
       */
      this.audioData = prepareAudio({
        audioId: "trial-audio",
        statusSelector: "#audio-status",
        sliderSelector: "#trial_slider",
        src: stim.AudioPath
      });

      /*
       * Randomize which continuation appears as A and B.
       */
      var options = _.shuffle([
        {
          key: "C1",
          text: stim.C1
        },
        {
          key: "C2",
          text: stim.C2
        }
      ]);

      this.A_key = options[0].key;
      this.B_key = options[1].key;

      $("#A_text").text(options[0].text);
      $("#B_text").text(options[1].text);
    },

    button: function () {
      var v = parseInt(
        $("#trial_slider").val(),
        10
      );

      /*
       * Require one complete playback.
       */
      if (
        !this.audioData ||
        !this.audioData.state.played ||
        !this.audioData.state.finished
      ) {
        $("#trial .err")
          .text(
            "Please listen to the complete sentence " +
            "before continuing."
          )
          .show();

        return;
      }

      /*
       * Require an actual slider response rather than leaving
       * the slider untouched at its midpoint.
       */
      if (!this.moved) {
        $("#trial .err")
          .text(
            "Please move the slider before continuing."
          )
          .show();

        return;
      }

      $("#trial .err").hide();

      var rt_ms = Date.now() - this.startTime;

      /*
       * Slider interpretation:
       *
       * 1–3 = A
       * 4   = neutral / equal
       * 5–7 = B
       */
      var chosen_option =
        v <= 3
          ? "A"
          : v >= 5
            ? "B"
            : "NEUTRAL";

      var chosen_key =
        chosen_option === "A"
          ? this.A_key
          : chosen_option === "B"
            ? this.B_key
            : "NEUTRAL";

      var chosen_text =
        chosen_key === "C1"
          ? this.stim.C1
          : chosen_key === "C2"
            ? this.stim.C2
            : null;

      /*
       * Raw signed slider score:
       *
       * -3 = strongly toward A
       *  0 = midpoint
       * +3 = strongly toward B
       */
      var raw_score = v - 4;

      /*
       * C1 is the focus-supported continuation.
       *
       * This score is oriented so that:
       * positive = movement toward C1
       * negative = movement toward C2
       *
       * This orientation is the same for neutral and focus
       * conditions, allowing the focus effect to be calculated
       * by comparing C1-oriented scores across variants.
       */
      var c1_option =
        this.A_key === "C1"
          ? "A"
          : "B";

      var score_rel_c1 =
        c1_option === "A"
          ? -raw_score
          : raw_score;

      /*
       * Retain the older expected-choice columns for
       * compatibility, but define C1 as the target continuation.
       */
      var expected_key = "C1";
      var expected_option = c1_option;
      var score_rel_expected = score_rel_c1;

      exp.data_trials.push({
        slide_number_in_experiment: exp.phase,
        list_assigned: exp.list,
        item_list: this.stim.List,

        type: this.stim.Type,
        group: this.stim.Group,
        item: this.stim.ItemID,
        variant: this.stim.Variant,
        filler_type: this.stim.FillerType || null,

        audio_path: this.stim.AudioPath,
        audio_played: this.audioData.state.played,
        audio_finished: this.audioData.state.finished,
        audio_play_count: this.audioData.state.playCount,
        audio_error: this.audioData.state.error,

        neutral_sentence:
          this.stim.NeutralSentence || null,

        cleft_sentence:
          this.stim.CleftSentence || null,

        focused_sentence:
          this.stim.FocusedSentence || null,

        spoken_sentence:
          this.stim.SpokenSentence || null,

        C1: this.stim.C1,
        C2: this.stim.C2,

        A_key: this.A_key,
        B_key: this.B_key,

        slider_value: v,
        raw_score: raw_score,

        c1_option: c1_option,
        score_rel_c1: score_rel_c1,

        expected_key: expected_key,
        expected_option: expected_option,
        score_rel_expected: score_rel_expected,

        chosen_option: chosen_option,
        chosen_key: chosen_key,
        chosen_text: chosen_text,

        rt_ms: rt_ms,

        item_feedback:
          $("#trial_feedback").val()
      });

      stopAudio(this.audioData.audio);

      _stream.apply(this);
    }
  });


  /*
   * PARTICIPANT INFORMATION
   */
  slides.subj_info = slide({
    name: "subj_info",

    start: function () {
      $("#language").val("");
      $("#experiment_about").val("");
      $("#comments").val("");
      $("#enjoyment").val("-1");
      $("#fairprice").val("-1");

      $('input[name="assess"]')
        .prop("checked", false);
    },

    submit: function () {
      exp.subj_data = {
        language:
          $("#language").val(),

        enjoyment:
          $("#enjoyment").val(),

        assess:
          $('input[name="assess"]:checked').val(),

        fairprice:
          $("#fairprice").val(),

        experiment_about:
          $("#experiment_about").val(),

        comments:
          $("#comments").val()
      };

      exp.go();
    }
  });


  /*
   * SUBMISSION
   */
  slides.thanks = slide({
    name: "thanks",

    start: function () {
      exp.data = {
        trials: exp.data_trials,
        catch_trials: exp.catch_trials,
        system: exp.system,
        list_assigned: exp.list,
        subject_information: exp.subj_data,

        time_in_minutes:
          (Date.now() - exp.startT) / 60000
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

  /*
   * Allow a particular counterbalancing list to be selected
   * through a URL such as:
   *
   * experiment.html?cond=3
   */
  var condition =
    new URLSearchParams(
      window.location.search
    ).get("cond");

  condition =
    condition === null
      ? NaN
      : parseInt(condition, 10);

  if (
    !isNaN(condition) &&
    condition >= 1 &&
    condition <= 15
  ) {
    exp.list = condition;
  } else {
    exp.list = _.sample([
      1, 2, 3, 4, 5,
      6, 7, 8, 9, 10,
      11, 12, 13, 14, 15
    ]);
  }

  /*
   * Each participant receives:
   *
   * 10 critical items from one counterbalancing list
   * 20 fillers
   */
  var critical = all_stims.filter(
    function (stimulus) {
      return (
        stimulus.Type === "critical" &&
        Number(stimulus.List) === exp.list
      );
    }
  );

  var fillers = all_stims.filter(
    function (stimulus) {
      return stimulus.Type === "filler";
    }
  );

  exp.stimuli = _.shuffle(
    critical.concat(fillers)
  );

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


  /*
   * Force only the current slide to remain visible.
   */
  function hideAllSlidesForce() {
    document
      .querySelectorAll(".slide")
      .forEach(function (element) {
        element.style.setProperty(
          "display",
          "none",
          "important"
        );
      });
  }


  function showSlideForce(id) {
    hideAllSlidesForce();

    var element =
      document.getElementById(id);

    if (element) {
      element.style.setProperty(
        "display",
        "block",
        "important"
      );
    }
  }


  hideAllSlidesForce();

  var originalGo = exp.go.bind(exp);

  exp.go = function () {
    hideAllSlidesForce();

    originalGo();

    var shown =
      window._s && window._s.name
        ? window._s.name
        : exp.structure[0];

    showSlideForce(shown);
  };


  $("#start_button")
    .off("click")
    .on("click", function () {
      exp.go();
    });


  exp.go();
}
