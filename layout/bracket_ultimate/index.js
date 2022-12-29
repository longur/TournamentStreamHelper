(($) => {
  var ASSET_TO_USE = "full";
  var ZOOM = 2;
  var ICON_TO_USE = "base_files/icon";
  var ICON_ZOOM = 1;

  var USE_ONLINE_PICTURE = false;

  gsap.config({ nullTargetWarn: false, trialWarn: false });

  let startingAnimation = gsap.timeline({ paused: true });

  function Start() {
    startingAnimation.restart();
  }

  var data = {};
  var oldData = {};

  var entryAnim = gsap.timeline();
  var animations = {};

  var iconAnimationsW = [];
  var iconAnimationsL = [];

  var players = [];
  var bracket = {};

  function AnimateLine(element) {
    let anim = null;

    if (element && element.get(0)) {
      element = element.get(0);
      let length = element.getTotalLength();
      anim = gsap.from(
        element,
        {
          duration: 0.4,
          "stroke-dashoffset": length,
          "stroke-dasharray": length,
          "stroke-linecap": "butt",
          opacity: 0,
          onUpdate: function (tl) {
            let tlp = (this.progress() * 100) >> 0;
            if (element) {
              let length = element.getTotalLength();
              TweenMax.set(element, {
                "stroke-dashoffset": (length / 100) * (100 - tlp),
                "stroke-dasharray": length,
                "stroke-linecap": tlp == 0 ? "butt" : "square",
                opacity: tlp == 0 ? 0 : 1,
              });
            }
          },
          onUpdateParams: ["{self}"],
        },
        0
      );
    }

    return anim;
  }

  /**
   * @param {string} _class
   * @param {Array} points
   */
  function GetBracketLineHtml(_class, points, color, hidden = false) {
    let newPoints = [];

    newPoints.push(points[0]);
    newPoints.push([points[1][0], points[0][1]]);
    newPoints.push(points[1]);

    let line = `<path class="${_class}" d="
    M${[newPoints[0][0], newPoints[0][1]].join(" ")}
    ${newPoints
      .slice(1)
      .map((point) => point.join(" "))
      .map((point) => "L" + point)
      .join(" ")}"
    stroke="${color}" fill="none" stroke-width="8" stroke-linecap="square" ${
      hidden ? 'style="opacity: 0"' : ""
    } />`;

    return line;
  }

  /**
   * @param {string} _class
   * @param {Array} points
   */
  function GetLineHtml(_class, points, color, hidden = false) {
    let line = `<path class="${_class}" d="
    M${points[0].join(" ")}
    ${points
      .slice(1)
      .map((point) => point.join(" "))
      .map((point) => "L" + point)
      .join(" ")}"
    stroke="${color}" fill="none" stroke-width="8" stroke-linecap="square" ${
      hidden ? 'style="opacity: 0"' : ""
    } />`;

    return line;
  }

  async function Update() {
    oldData = data;
    data = await getData();

    if (
      !oldData.bracket ||
      JSON.stringify(data.bracket.bracket) !=
        JSON.stringify(oldData.bracket.bracket)
    ) {
      bracket = data.bracket.bracket.rounds;
      players = data.bracket.players.slot;

      let progressionsOut = data.bracket.bracket.progressionsOut;
      let progressionsIn = data.bracket.bracket.progressionsIn;

      let biggestRound = Math.max.apply(
        null,
        Object.values(bracket).map((r) => Object.keys(r.sets).length)
      );
      console.log(biggestRound);

      let size = 32;
      $(":root").css("--player-height", size);

      while (
        biggestRound * (2 * parseInt($(":root").css("--player-height")) + 4) >
        $(".winners_container").height() - 20
      ) {
        size -= 1;
        $(":root").css("--player-height", size);
      }
      $(":root").css("--name-size", Math.min(size - size * 0.3, 16));
      $(":root").css("--score-size", size - size * 0.3);
      $(":root").css("--flag-height", size - size * 0.4);

      if (
        !oldData.bracket ||
        oldData.bracket.bracket.length != data.bracket.bracket.length
      ) {
        // WINNERS SIDE
        let html = "";

        let winnersRounds = Object.fromEntries(
          Object.entries(bracket).filter(([round]) => parseInt(round) > 0)
        );

        // First row has only the player slots
        Object.entries(winnersRounds)
          .slice(0, 1)
          .forEach(([roundKey, round], r) => {
            html += `<div class="round round_base_w">`;
            Object.values(round.sets).forEach((slot, i) => {
              Object.values(slot.playerId).forEach((playerId, p) => {
                html += `
                  <div class="slot_full slot_${
                    i + 1
                  } p_${playerId} slot_p_${p} player container">
                    <div class="icon avatar"></div>
                    <div class="icon online_avatar"></div>
                    <div class="name_twitter">
                    <div class="name"></div>
                    </div>
                    <div class="sponsor_icon"></div>
                    <div class="flags">
                      <div class="flagcountry"></div>
                      <div class="flagstate"></div>
                    </div>
                    <div class="character_container"></div>
                  </div>
                `;
              });
            });
            html += "</div>";
          });

        Object.entries(winnersRounds)
          .slice(0, -2)
          .forEach(([roundKey, round], r) => {
            html += `<div class="round round_${roundKey}">`;
            html += `<div class="round_name"></div>`;
            Object.values(round.sets).forEach((slot, i) => {
              html += `<div class="slot_${
                i + 1
              }" style="width: 32px; height: 32px; align-self: center;"></div>`;
            });
            html += "</div>";
          });

        $(".winners_container").html(html);

        html = "";

        Object.entries(winnersRounds)
          .slice(-2, -1)
          .forEach(([roundKey, round], r) => {
            html += `<div class="round round_${roundKey}">`;
            html += `<div class="round_name"></div>`;
            Object.values(round.sets).forEach((slot, i) => {
              html += `<div class="slot_${
                i + 1
              }" style="width: 32px; height: 32px; align-self: center;"></div>`;
            });
            html += "</div>";
          });

        $(".center_container").html(html);

        // LOSERS SIDE
        html = "";

        let losersRounds = Object.fromEntries(
          Object.entries(bracket).filter(([round]) => parseInt(round) < 0)
        );

        Object.entries(losersRounds)
          .reverse()
          .forEach(([roundKey, round], r) => {
            html += `<div class="round round_${roundKey}">`;
            html += `<div class="round_name"></div>`;
            Object.values(round.sets).forEach((slot, i) => {
              if (r % 2 == 1) {
                html += `
                  <div class="slot_hanging slot_hanging_${
                    i + 1
                  } p_${0} slot_p_${0} player container">
                    <div class="character_container"></div>
                    <div class="name"></div>
                  </div>
                `;
                html += `<div class="slot_sibling_${
                  i + 1
                }" style="width: 32px; height: 32px; align-self: center;"></div>`;
              } else {
              }
              html += `<div class="slot_${
                i + 1
              }" style="width: 32px; height: 32px; align-self: center;"></div>`;

              if (r % 2 == 1) {
                html += `<div class="slot_sibling_${
                  i + 1
                }" style="width: 32px; height: 32px; align-self: center;"></div>`;
              }
            });
            html += "</div>";
          });

        // Last row has all players
        Object.entries(losersRounds)
          .slice(0, 1)
          .forEach(([roundKey, round], r) => {
            html += `<div class="round round_base_l">`;
            Object.values(round.sets).forEach((slot, i) => {
              Object.values(slot.playerId).forEach((playerId, p) => {
                html += `<div class="slot_sibling_${
                  i + 1
                }" style="width: 32px; height: 32px; align-self: center;"></div>`;

                html += `
                  <div class="slot_hanging slot_${
                    i + 1
                  } p_${playerId} slot_p_${p} player container">
                    <div class="character_container"></div>
                    <div class="name"></div>
                  </div>
                `;
              });
            });
            html += "</div>";
          });

        $(".losers_container").html(html);

        // ICONS
        html = "";

        Object.entries(players).forEach(([teamId, team], t) => {
          Object.entries(team.player).forEach(([playerId, player], p) => {
            html += `
            <div class="bracket_icon bracket_icon_p${teamId}">
              <div class="icon_name_arrow">
                <div class="icon_name"></div>
                <div class="icon_arrow_border"></div>
                <div class="icon_arrow"></div>
              </div>
              <div class="icon_image"></div>
            </div>`;
            return;
          });
        });

        $(".winners_icons").html(html);
        $(".losers_icons").html(html);

        // BRACKET LINES
        // .line_r_(round) = Line going from (round) set to the next set
        let slotLines = "";
        let slotLinesW = "";

        let baseClass = "winners_container";

        Object.entries(bracket).forEach(function ([roundKey, round], r) {
          if (parseInt(roundKey) < 0) {
            baseClass = "losers_container";
          } else {
            baseClass = "winners_container";
          }

          Object.values(round.sets).forEach(
            function (slot, i) {
              let lastLosers =
                parseInt(roundKey) ==
                Math.min.apply(
                  null,
                  Object.keys(bracket).map((r) => parseInt(r))
                );

              if (
                slot.nextWin &&
                !(
                  slot.playerId[0] > Object.keys(players).length ||
                  slot.playerId[1] > Object.keys(players).length ||
                  slot.playerId[0] == -1 ||
                  slot.playerId[1] == -1
                )
              ) {
                let slotElement = $(
                  `.${this.baseClass} .round_${roundKey} .slot_${i + 1}`
                );

                if (!slotElement || !slotElement.offset()) return;

                let winElement = $(
                  `.${this.baseClass} .round_${slot.nextWin[0]} .slot_${
                    slot.nextWin[1] + 1
                  }`
                );

                // Initial line from base
                if (roundKey == "1" || roundKey == "-1") {
                  [0, 1].forEach((index) => {
                    let className =
                      roundKey == "1" ? "round_base_w" : "round_base_l";

                    let baseElement = $(
                      `.${this.baseClass} .${className} .slot_${
                        i + 1
                      }.slot_p_${index}`
                    );

                    let points = [
                      [
                        baseElement.offset().left +
                          baseElement.outerWidth() / 2,
                        baseElement.offset().top +
                          baseElement.outerHeight() / 2,
                      ],
                      [
                        slotElement.offset().left +
                          slotElement.outerWidth() / 2,
                        slotElement.offset().top +
                          slotElement.outerHeight() / 2,
                      ],
                    ];

                    slotLines += GetBracketLineHtml(
                      `${this.baseClass} line_base_r_${roundKey} s_${
                        i + 1
                      } p_${index}`,
                      points,
                      "gray"
                    );

                    slotLinesW += GetLineHtml(
                      `${this.baseClass} line_base_r_${roundKey} s_${
                        i + 1
                      } p_${index} base`,
                      [points[0], [points[1][0], points[0][1]]],
                      "yellow",
                      true
                    );

                    slotLinesW += GetLineHtml(
                      `${this.baseClass} line_base_r_${roundKey} s_${
                        i + 1
                      } p_${index} win`,
                      [[points[1][0], points[0][1]], points[1]],
                      "yellow",
                      true
                    );
                  });
                }

                if (
                  winElement &&
                  winElement.offset() &&
                  parseInt(roundKey) > 0
                ) {
                  let points = [
                    [
                      slotElement.offset().left + slotElement.outerWidth() / 2,
                      slotElement.offset().top + slotElement.outerHeight() / 2,
                    ],
                    [
                      winElement.offset().left + winElement.outerWidth() / 2,
                      winElement.offset().top + winElement.outerHeight() / 2,
                    ],
                  ];

                  slotLines += GetBracketLineHtml(
                    `${this.baseClass} line_r_${roundKey} s_${i + 1}`,
                    points,
                    "gray"
                  );

                  slotLinesW += GetBracketLineHtml(
                    `${this.baseClass} line_r_${parseInt(roundKey) + 1} s_${
                      i + 1
                    } base`,
                    [points[0], [points[1][0], points[0][1]]],
                    "yellow",
                    true
                  );

                  slotLinesW += GetBracketLineHtml(
                    `${this.baseClass} line_r_${parseInt(roundKey) + 1} s_${
                      i + 1
                    } win`,
                    [[points[1][0], points[0][1]], points[1]],
                    "yellow",
                    true
                  );
                }

                if (parseInt(roundKey) < 0) {
                  if (parseInt(roundKey) % 2 == -1) {
                    let hangingElement = $(
                      `.${this.baseClass} .round_${roundKey} .slot_hanging_${
                        i + 1
                      }`
                    );

                    if (
                      winElement &&
                      winElement.offset() &&
                      hangingElement &&
                      hangingElement.offset()
                    ) {
                      let points = [
                        [
                          hangingElement.offset().left +
                            hangingElement.outerWidth() / 2,
                          hangingElement.offset().top +
                            hangingElement.outerHeight() / 2,
                        ],
                        [
                          winElement.offset().left +
                            winElement.outerWidth() / 2,
                          winElement.offset().top +
                            winElement.outerHeight() / 2,
                        ],
                      ];

                      slotLines += GetBracketLineHtml(
                        `${this.baseClass} line_hanging_r_${roundKey} s_${
                          i + 1
                        }`,
                        points,
                        "gray"
                      );

                      slotLinesW += GetBracketLineHtml(
                        `${this.baseClass} line_hanging_r_${
                          parseInt(roundKey) - 1
                        } s_${2 * i + 1} base`,
                        [points[0], [points[1][0], points[0][1]]],
                        "yellow",
                        true
                      );

                      slotLinesW += GetBracketLineHtml(
                        `${this.baseClass} line_hanging_r_${
                          parseInt(roundKey) - 1
                        } s_${2 * i + 1} win`,
                        [[points[1][0], points[0][1]], points[1]],
                        "yellow",
                        true
                      );
                    }
                  }
                  if (winElement && winElement.offset()) {
                    let points = [
                      [
                        slotElement.offset().left +
                          slotElement.outerWidth() / 2,
                        slotElement.offset().top +
                          slotElement.outerHeight() / 2,
                      ],
                      [
                        winElement.offset().left + winElement.outerWidth() / 2,
                        winElement.offset().top + winElement.outerHeight() / 2,
                      ],
                    ];

                    slotLines += GetBracketLineHtml(
                      `${this.baseClass} line_r_${roundKey} s_${(i + 1) * 2}`,
                      points,
                      "gray"
                    );

                    slotLinesW += GetBracketLineHtml(
                      `${this.baseClass} line_r_${parseInt(roundKey) - 1} s_${
                        parseInt(roundKey) % 2 == -1 ? 2 * i + 2 : i + 1
                      } base`,
                      [points[0], [points[1][0], points[0][1]]],
                      "yellow",
                      true
                    );

                    slotLinesW += GetBracketLineHtml(
                      `${this.baseClass} line_r_${parseInt(roundKey) - 1} s_${
                        parseInt(roundKey) % 2 == -1 ? 2 * i + 2 : i + 1
                      } win`,
                      [[points[1][0], points[0][1]], points[1]],
                      "yellow",
                      true
                    );
                  }
                }
              }
            },
            { baseClass: baseClass }
          );
        });

        $(".lines.base").html(slotLines);
        $(".lines.win").html(slotLinesW);

        // ICON ANIMATIONS
        // For each player
        Object.entries(players).forEach(([teamId, team], t) => {
          Object.entries(team.player).forEach(([playerId, player], p) => {
            // Winners path
            let icon_element = $(
              `.winners_icons .bracket_icon.bracket_icon_p${teamId}`
            );
            if (!icon_element) return;

            let icon_anim = gsap.timeline();
            let prevSlot = null;

            // We follow the bracket and add the positions the player appeared
            // to the animation
            Object.entries(winnersRounds)
              .slice(0, -2)
              .forEach(([roundKey, round], r) => {
                Object.values(round.sets).forEach((slot, i) => {
                  Object.values(slot.playerId).forEach(
                    (slotPlayerId, slotIndex) => {
                      if (
                        (roundKey == "1" && slotPlayerId == teamId) ||
                        (prevSlot &&
                          prevSlot.nextWin &&
                          prevSlot.nextWin[0] == parseInt(roundKey) &&
                          prevSlot.nextWin[1] == i &&
                          slotIndex == prevSlot.winSlot)
                      ) {
                        prevSlot = slot;

                        if (roundKey == "1") {
                          let setElement = $(
                            `.round_base_w .slot_${i + 1}.slot_p_${slotIndex}`
                          );

                          if (setElement && setElement.offset()) {
                            icon_anim.set($(icon_element), {
                              x:
                                setElement.offset().left +
                                setElement.outerWidth() -
                                $(icon_element).outerWidth() / 4,
                              y:
                                setElement.offset().top +
                                setElement.outerHeight() / 2 -
                                $(icon_element).outerHeight() / 2,
                            });
                            icon_anim.addLabel("start");
                          }

                          icon_anim.add(
                            AnimateLine(
                              $(
                                `.lines.win .winners_container.line_base_r_${roundKey}.s_${
                                  i + 1
                                }.p_${slotIndex}.base`
                              )
                            )
                          );
                        }

                        let setElement = $(`.round_${roundKey} .slot_${i + 1}`);

                        icon_anim.add(
                          AnimateLine(
                            $(
                              `.lines.win .winners_container.line_r_${roundKey}.s_${
                                2 * i + 1 + slotIndex
                              }.base`
                            )
                          )
                        );

                        if (setElement && setElement.offset()) {
                          icon_anim.to($(icon_element), {
                            x: setElement.offset().left,
                            duration: 1,
                          });

                          icon_anim.addLabel(`round_${roundKey}`);

                          // Animation if won
                          if (roundKey == "1") {
                            icon_anim.add(
                              AnimateLine(
                                $(
                                  `.lines.win .winners_container.line_base_r_${roundKey}.s_${
                                    i + 1
                                  }.p_${slotIndex}.win`
                                )
                              )
                            );
                          } else {
                            icon_anim.add(
                              AnimateLine(
                                $(
                                  `.lines.win .winners_container.line_r_${roundKey}.s_${
                                    2 * i + 1 + slotIndex
                                  }.win`
                                )
                              )
                            );
                          }
                          icon_anim.to($(icon_element), {
                            x: setElement.offset().left,
                            y: setElement.offset().top,
                            duration: 1,
                          });
                        }
                      }
                    }
                  );
                });
              });

            iconAnimationsW.push(icon_anim);

            // Losers path
            icon_element = $(
              `.losers_icons .bracket_icon.bracket_icon_p${teamId}`
            );
            if (!icon_element) return;

            icon_anim = gsap.timeline();
            prevSlot = null;

            let appearRounds = [];

            Object.entries(winnersRounds).forEach(([roundKey, round], r) => {
              Object.values(round.sets).forEach((set, s) => {
                if (set.nextLose) {
                  if (set.nextLose[0] == 0) set.nextLose[0] = -1;
                  appearRounds.push(set.nextLose);
                }
              });
            });

            let found = false;

            if (t < Object.keys(players).length) {
              Object.entries(losersRounds).forEach(([roundKey, round], r) => {
                Object.values(round.sets).forEach((slot, i) => {
                  Object.values(slot.playerId).forEach(
                    (slotPlayerId, slotIndex) => {
                      if (
                        (prevSlot &&
                          prevSlot.nextWin &&
                          prevSlot.nextWin[0] == parseInt(roundKey) &&
                          prevSlot.nextWin[1] == i &&
                          slotIndex == prevSlot.winSlot) ||
                        (roundKey != "-1" &&
                          appearRounds[t] &&
                          parseInt(roundKey) == appearRounds[t][0] &&
                          i == appearRounds[t][1] &&
                          !found) ||
                        (roundKey == "-1" &&
                          appearRounds[t] &&
                          parseInt(roundKey) == appearRounds[t][0] &&
                          2 * i + slotIndex == appearRounds[t][1])
                      ) {
                        prevSlot = slot;

                        if (roundKey == "-1") {
                          let setElement = $(
                            `.round_base_l .slot_${i + 1}.slot_p_${slotIndex}`
                          );

                          if (setElement && setElement.offset()) {
                            icon_anim.set($(icon_element), {
                              x:
                                setElement.offset().left -
                                ($(icon_element).outerWidth() * 3) / 4,
                              y:
                                setElement.offset().top +
                                setElement.outerHeight() / 2 -
                                $(icon_element).outerHeight() / 2,
                            });
                          }
                          icon_anim.addLabel(`start`);

                          icon_anim.add(
                            AnimateLine(
                              $(
                                `.lines.win .losers_container.line_base_r_${roundKey}.s_${
                                  i + 1
                                }.p_${slotIndex}.base`
                              )
                            )
                          );

                          // icon_anim.addLabel(`round_${roundKey}`);
                        } else if (!found) {
                          let setElement = $(
                            `.round_${parseInt(roundKey) + 1} .slot_hanging_${
                              i + 1
                            }`
                          );

                          if (setElement && setElement.offset()) {
                            icon_anim.set($(icon_element), {
                              x:
                                setElement.offset().left -
                                ($(icon_element).outerWidth() * 3) / 4,
                              y:
                                setElement.offset().top +
                                setElement.outerHeight() / 2 -
                                $(icon_element).outerHeight() / 2,
                            });
                          }
                          icon_anim.addLabel(`start`);

                          icon_anim.add(
                            AnimateLine(
                              $(
                                `.lines.win .losers_container.line_hanging_r_${parseInt(
                                  roundKey
                                )}.s_${2 * i + 1}.base`
                              )
                            )
                          );

                          // icon_anim.addLabel(`round_${parseInt(roundKey)}`);
                        }

                        let setElement = $(`.round_${roundKey} .slot_${i + 1}`);

                        if (parseInt(roundKey) % 2 == 0 && slotIndex % 2 == 1) {
                          icon_anim.add(
                            AnimateLine(
                              $(
                                `.lines.win .losers_container.line_r_${roundKey}.s_${
                                  2 * (i + 1)
                                }.base`
                              )
                            )
                          );
                        } else {
                          icon_anim.add(
                            AnimateLine(
                              $(
                                `.lines.win .losers_container.line_r_${roundKey}.s_${
                                  slotIndex + 1
                                }.base`
                              )
                            )
                          );
                        }

                        if (setElement && setElement.offset()) {
                          icon_anim.to($(icon_element), {
                            x: setElement.offset().left,
                            duration: 1,
                          });

                          icon_anim.addLabel(`round_${roundKey}`);

                          // Animation if won
                          if (roundKey == "-1") {
                            icon_anim.add(
                              AnimateLine(
                                $(
                                  `.lines.win .losers_container.line_base_r_${-1}.s_${
                                    i + 1
                                  }.p_${slotIndex}.win`
                                )
                              )
                            );
                          } else if (found) {
                            if (
                              parseInt(roundKey) % 2 == 0 &&
                              slotIndex % 2 == 1
                            ) {
                              icon_anim.add(
                                AnimateLine(
                                  $(
                                    `.lines.win .losers_container.line_r_${roundKey}.s_${
                                      2 * (i + 1)
                                    }.win`
                                  )
                                )
                              );
                            } else {
                              icon_anim.add(
                                AnimateLine(
                                  $(
                                    `.lines.win .losers_container.line_r_${roundKey}.s_${
                                      slotIndex + 1
                                    }.win`
                                  )
                                )
                              );
                            }
                          } else {
                            icon_anim.add(
                              AnimateLine(
                                $(
                                  `.lines.win .losers_container.line_hanging_r_${roundKey}.s_${
                                    2 * i + 1
                                  }.win`
                                )
                              )
                            );
                          }
                          icon_anim.to($(icon_element), {
                            x: setElement.offset().left,
                            y: setElement.offset().top,
                            duration: 1,
                          });
                        }

                        found = true;
                      }
                    }
                  );
                });
              });

              console.log(icon_anim.labels);
              iconAnimationsL.push(icon_anim);
            }

            return;
          });
        });
      }

      let GfResetRoundNum = Math.max.apply(
        null,
        Object.keys(bracket).map((r) => parseInt(r))
      );

      let gf = bracket[GfResetRoundNum - 1].sets[0];
      let isReset = gf.score[0] < gf.score[1];

      // COLORIZE LINES
      Object.entries(bracket).forEach(function ([roundKey, round], r) {
        Object.values(round.sets).forEach((set, setIndex) => {
          let won = false;

          if (
            set.nextWin &&
            bracket[set.nextWin[0]] &&
            bracket[set.nextWin[0]].sets
          ) {
            let nextSet = bracket[set.nextWin[0]].sets[set.nextWin[1]];

            let wonSet =
              set.score[0] > set.score[1] ? set.playerId[0] : set.playerId[1];

            if (nextSet) {
              let wonNextSet =
                nextSet.score[0] > nextSet.score[1]
                  ? nextSet.playerId[0]
                  : nextSet.playerId[1];

              if (wonNextSet == wonSet) {
                won = true;
              }
            }
          }

          // if (roundKey == "1" || roundKey == "-1") {
          //   let wonIndex = set.score[0] > set.score[1] ? 0 : 1;

          //   $(`.line_base_r_${roundKey}.s_${setIndex + 1}.p_${wonIndex}`).attr(
          //     "stroke",
          //     "yellow"
          //   );
          // }

          // $(`.line_r_${roundKey}.s_${setIndex + 1}`).attr(
          //   "stroke",
          //   won ? "yellow" : "gray"
          // );
        });
      });

      // TRIGGER ANIMATIONS
      if (entryAnim && entryAnim.progress() >= 1) {
        Object.entries(bracket).forEach(function ([roundKey, round], r) {
          Object.values(round.sets).forEach((set, setIndex) => {
            AnimateElement(roundKey, setIndex, set);
          });
        });
      }

      // UPDATE SCORES
      Object.entries(bracket).forEach(function ([roundKey, round], r) {
        SetInnerHtml($(`.round_${parseInt(roundKey)} .round_name`), round.name);

        Object.values(round.sets).forEach(function (slot, i) {
          Object.values(slot.score).forEach(function (score, p) {
            SetInnerHtml(
              $(
                `.round_${parseInt(roundKey)} .slot_${
                  i + 1
                }.slot_p_${p}.container .score`
              ),
              `
                  ${score == -1 ? "DQ" : score}
                `
            );
          });
          if (slot.score[0] > slot.score[1]) {
            $(
              `.round_${parseInt(roundKey)} .slot_${
                i + 1
              }.slot_p_${0}.container`
            ).css("filter", "brightness(1)");
            $(
              `.round_${parseInt(roundKey)} .slot_${
                i + 1
              }.slot_p_${1}.container`
            ).css("filter", "brightness(0.6)");
          } else if (slot.score[1] > slot.score[0]) {
            $(
              `.round_${parseInt(roundKey)} .slot_${
                i + 1
              }.slot_p_${0}.container`
            ).css("filter", "brightness(0.6)");
            $(
              `.round_${parseInt(roundKey)} .slot_${
                i + 1
              }.slot_p_${1}.container`
            ).css("filter", "brightness(1)");
          } else {
            $(
              `.round_${parseInt(roundKey)} .slot_${
                i + 1
              }.slot_p_${0}.container`
            ).css("filter", "brightness(1)");
            $(
              `.round_${parseInt(roundKey)} .slot_${
                i + 1
              }.slot_p_${1}.container`
            ).css("filter", "brightness(1)");
          }
        });
      });

      // UPDATE PLAYER DATA
      Object.entries(bracket).forEach(function ([roundKey, round], r) {
        Object.values(round.sets).forEach((set, setIndex) => {
          set.playerId.forEach((pid, index) => {
            if (parseInt(roundKey) > 0 && roundKey != "1") return;

            let element = null;

            if (parseInt(roundKey) > 0) {
              element = $(
                `.round_base_w .slot_${setIndex + 1}.slot_p_${index}`
              ).get(0);
            } else {
              if (roundKey == "-1") {
                element = $(
                  `.round_base_l .slot_${setIndex + 1}.slot_p_${index}`
                ).get(0);
              } else {
                element = $(
                  `.round_${parseInt(roundKey) + 1} .slot_hanging_${
                    setIndex + 1
                  }.slot_p_${index}`
                ).get(0);
              }
            }

            if (!element) return;

            let player = null;

            if (players[pid]) player = players[pid].player["1"];

            SetInnerHtml(
              $(element).find(`.name`),
              `
                <span>
                  <span class="sponsor">
                    ${player && player.team ? player.team : ""}
                  </span>
                  ${player ? player.name : ""}
                </span>
              `
            );

            SetInnerHtml(
              $(element).find(`.flagcountry`),
              player && player.country.asset
                ? `<div class='flag' style='background-image: url(../../${player.country.asset.toLowerCase()})'></div>`
                : ""
            );

            SetInnerHtml(
              $(element).find(`.flagstate`),
              player && player.state.asset
                ? `<div class='flag' style='background-image: url(../../${player.state.asset})'></div>`
                : ""
            );

            let charactersHtml = "";

            if (player && player.character) {
              Object.values(player.character).forEach((character, index) => {
                if (character.assets[ASSET_TO_USE]) {
                  charactersHtml += `
                    <div class="icon stockicon">
                        <div
                          style='background-image: url(../../${
                            character.assets[ASSET_TO_USE].asset
                          })'
                          data-asset='${JSON.stringify(
                            character.assets[ASSET_TO_USE]
                          )}'
                          data-zoom='${ZOOM}'
                        >
                        </div>
                    </div>
                    `;
                }
              });
            }
            SetInnerHtml(
              $(element).find(`.character_container`),
              charactersHtml,
              undefined,
              0.5,
              () => {
                $(element)
                  .find(`.character_container .icon.stockicon div`)
                  .each((e, i) => {
                    if (
                      player &&
                      player.character[1] &&
                      player.character[1].assets[ASSET_TO_USE] != null
                    ) {
                      CenterImage(
                        $(i),
                        $(i).attr("data-asset"),
                        $(i).attr("data-zoom"),
                        { x: 0.5, y: 0.5 },
                        $(i).parent().parent()
                      );
                    }
                  });
              }
            );

            SetInnerHtml(
              $(element).find(`.sponsor_icon`),
              player && player.sponsor_logo
                ? `<div style='background-image: url(../../${player.sponsor_logo})'></div>`
                : "<div></div>"
            );

            SetInnerHtml(
              $(element).find(`.avatar`),
              player && player.avatar
                ? `<div style="background-image: url('../../${player.avatar}')"></div>`
                : ""
            );

            SetInnerHtml(
              $(element).find(`.online_avatar`),
              player && player.online_avatar
                ? `<div style="background-image: url('${player.online_avatar}')"></div>`
                : '<div style="background: gray)"></div>'
            );

            SetInnerHtml(
              $(element).find(`.twitter`),
              player && player.twitter
                ? `<span class="twitter_logo"></span>${String(player.twitter)}`
                : ""
            );

            SetInnerHtml(
              $(element).find(`.sponsor-container`),
              `<div class='sponsor-logo' style='background-image: url(../../${
                player ? player.sponsor_logo : ""
              })'></div>`
            );
          });
        });
      });
    }

    // UPDATE ICONS
    Object.entries(players).forEach(([teamId, team], t) => {
      Object.entries(team.player).forEach(([playerId, player], p) => {
        let element = $(`.winners_icons .bracket_icon.bracket_icon_p${teamId}`);
        if (!element) return;
        let charactersHtml = "";

        SetInnerHtml(
          $(element).find(`.icon_name`),
          `
            <span>
              ${player ? player.name : ""}
            </span>
          `
        );

        if (!USE_ONLINE_PICTURE) {
          if (
            player &&
            (!oldData.bracket ||
              JSON.stringify(oldData.bracket.players.slot[teamId]) !=
                JSON.stringify(data.bracket.players.slot[teamId]))
          ) {
            if (player && player.character) {
              Object.values(player.character).forEach((character, index) => {
                if (character.assets[ICON_TO_USE]) {
                  charactersHtml += `
                    <div class="floating_icon stockicon">
                        <div
                          style='background-image: url(../../${
                            character.assets[ICON_TO_USE].asset
                          })'
                          data-asset='${JSON.stringify(
                            character.assets[ICON_TO_USE]
                          )}'
                          data-zoom='${ICON_ZOOM}'
                        >
                        </div>
                    </div>
                    `;
                }
              });
            }
            SetInnerHtml(
              $(element).find(".icon_image"),
              charactersHtml,
              undefined,
              0,
              () => {
                $(element)
                  .find(`.icon_image .floating_icon.stockicon div`)
                  .each((e, i) => {
                    if (
                      player &&
                      player.character[1] &&
                      player.character[1].assets[ICON_TO_USE] != null
                    ) {
                      CenterImage(
                        $(i),
                        $(i).attr("data-asset"),
                        $(i).attr("data-zoom"),
                        { x: 0.5, y: 0.5 },
                        $(i),
                        true,
                        true
                      );
                    }
                  });
              }
            );
          }
        } else {
          SetInnerHtml(
            $(element).find(".icon_image"),
            player && player.online_avatar
              ? `<div style="background-image: url('${player.online_avatar}')"></div>`
              : '<div style="background: gray; width: 100%; height: 100%; border-radius: 8px;"></div>'
          );
        }

        // TRIGGER ANIMATIONS
        Object.entries(players).forEach(([teamId, team], t) => {
          ["winners"].forEach((side) => {
            let lastFoundRound = 0;

            let GfResetRoundNum = Math.max.apply(
              null,
              Object.keys(bracket).map((r) => parseInt(r))
            );

            Object.entries(bracket).forEach(function ([roundKey, round], r) {
              if (side == "winners" && parseInt(roundKey) < 0) return;
              if (side == "losers" && parseInt(roundKey) > 0) return;
              Object.values(round.sets).forEach(function (set, setIndex) {
                if (
                  ((side == "losers" &&
                    parseInt(roundKey) < parseInt(lastFoundRound)) ||
                    (side == "winners" &&
                      parseInt(roundKey) > parseInt(lastFoundRound))) &&
                  (set.playerId[0] == teamId || set.playerId[1] == teamId) &&
                  roundKey != GfResetRoundNum
                ) {
                  lastFoundRound = roundKey;
                }
              });
            });

            iconAnimationsW[t].tweenTo(`round_${lastFoundRound}`);
          });
        });

        let appearRounds = [];

        Object.entries(bracket).forEach(([roundKey, round], r) => {
          if (parseInt(roundKey) < 0) return;
          Object.values(round.sets).forEach((set, s) => {
            if (set.nextLose) {
              if (set.nextLose[0] == 0) set.nextLose[0] = -1;
              appearRounds.push(set.nextLose);
            }
          });
        });

        console.log("Start");
        Object.entries(players).forEach(([teamId, team], t) => {
          let lastFoundRound = 0;
          let losersIconId = null;

          Object.entries(bracket).forEach(function ([roundKey, round], r) {
            if (parseInt(roundKey) > 0) return;
            Object.values(round.sets).forEach(function (set, setIndex) {
              if (
                parseInt(roundKey) < parseInt(lastFoundRound) &&
                (set.playerId[0] == teamId || set.playerId[1] == teamId)
              ) {
                console.log(set.playerId, teamId);
                lastFoundRound = roundKey;

                if (losersIconId == null) {
                  let found = null;

                  appearRounds.forEach((appearRound, i) => {
                    if (
                      parseInt(roundKey) == appearRound[0] &&
                      setIndex == appearRound[1]
                    ) {
                      if (roundKey == "-1") {
                        if (set.playerId[0] == teamId) {
                          losersIconId = 2 * i;
                          return;
                        }
                        if (set.playerId[1] == teamId) {
                          losersIconId = 2 * i + 1;
                          return;
                        }
                      } else {
                        losersIconId = i;
                        return;
                      }
                    }
                  });

                  // if (roundKey == "-1") {
                  //   losersId = set.playerId[(t + 1) % 2];
                  // } else {
                  //   losersId = set.playerId[0];
                  // }
                  console.log("player", teamId, "loserdId", losersIconId);
                }
              }
            });
          });

          if (lastFoundRound == 0 || losersIconId == null)
            iconAnimationsL[t].tweenTo(`start`);
          else {
            if (
              iconAnimationsL[losersIconId].labels.hasOwnProperty(
                `round_${lastFoundRound}`
              )
            ) {
              iconAnimationsL[losersIconId].tweenTo(`round_${lastFoundRound}`);
            } else {
              iconAnimationsL[losersIconId].tweenTo(`start`);
            }

            let element = $(
              `.losers_icons .bracket_icon.bracket_icon_p${losersIconId + 1}`
            );
            if (!element) return;

            SetInnerHtml(
              $(element).find(`.icon_name`),
              `
                <span>
                  ${team.player["1"] ? team.player["1"].name : ""}
                </span>
              `
            );
          }
        });

        // TODO
        // ICON ANIMATIONS
        // For each player
        // Object.entries(players).forEach(([teamId, team], t) => {
        //   Object.entries(team.player).forEach(([playerId, player], p) => {
        //     // Winners path
        //     let icon_element = $(
        //       `.winners_icons .bracket_icon.bracket_icon_p${teamId}`
        //     );
        //     if (!icon_element) return;

        //     let icon_anim = gsap.timeline();

        //     // We follow the bracket and add the positions the player appeared
        //     // to the animation
        //     Object.entries(winnersRounds)
        //       .slice(0, -2)
        //       .forEach(([roundKey, round], r) => {
        //         Object.values(round.sets).forEach((slot, i) => {
        //           Object.values(slot.playerId).forEach(
        //             (slotPlayerId, slotIndex) => {
        //               if (slotPlayerId == teamId) {
        //                 if (roundKey == "1") {
        //                   let setElement = $(
        //                     `.round_base_w .slot_${i + 1}.slot_p_${slotIndex}`
        //                   );

        //                   if (setElement && setElement.offset()) {
        //                     icon_anim.set($(icon_element), {
        //                       x:
        //                         setElement.offset().left +
        //                         setElement.outerWidth() -
        //                         $(icon_element).outerWidth() / 4,
        //                       y:
        //                         setElement.offset().top +
        //                         setElement.outerHeight() / 2 -
        //                         $(icon_element).outerHeight() / 2,
        //                     });
        //                     icon_anim.addLabel("start");
        //                   }

        //                   icon_anim.add(
        //                     AnimateLine(
        //                       $(
        //                         `.lines.win .winners_container.line_base_r_${roundKey}.s_${
        //                           i + 1
        //                         }.p_${slotIndex}.base`
        //                       )
        //                     )
        //                   );
        //                   icon_anim.addLabel("round_1");
        //                 }

        //                 let setElement = $(`.round_${roundKey} .slot_${i + 1}`);

        //                 icon_anim.add(
        //                   AnimateLine(
        //                     $(
        //                       `.lines.win .winners_container.line_r_${roundKey}.s_${
        //                         slotIndex + 1
        //                       }.base`
        //                     )
        //                   )
        //                 );

        //                 if (setElement && setElement.offset()) {
        //                   icon_anim.to($(icon_element), {
        //                     x: setElement.offset().left,
        //                     duration: 1,
        //                   });

        //                   // Only continue if won
        //                   if (
        //                     slot.score[slotIndex] >
        //                     slot.score[(slotIndex + 1) % 2]
        //                   ) {
        //                     if (roundKey == "1") {
        //                       icon_anim.add(
        //                         AnimateLine(
        //                           $(
        //                             `.lines.win .winners_container.line_base_r_${roundKey}.s_${
        //                               i + 1
        //                             }.p_${slotIndex}.win`
        //                           )
        //                         )
        //                       );
        //                     } else {
        //                       icon_anim.add(
        //                         AnimateLine(
        //                           $(
        //                             `.lines.win .winners_container.line_r_${roundKey}.s_${
        //                               slotIndex + 1
        //                             }.win`
        //                           )
        //                         )
        //                       );
        //                     }
        //                     icon_anim.to($(icon_element), {
        //                       x: setElement.offset().left,
        //                       y: setElement.offset().top,
        //                       duration: 1,
        //                     });
        //                   } else {
        //                     // TODO: remove
        //                     icon_anim.fromTo(
        //                       $(icon_element).find(".icon_image"),
        //                       { filter: "brightness(1)" },
        //                       {
        //                         filter: "brightness(.5)",
        //                         duration: 0.4,
        //                       }
        //                     );
        //                   }
        //                 }
        //               }
        //             }
        //           );
        //         });
        //       });

        //     iconAnimationsW.push(icon_anim);

        //     // Losers path
        //     icon_element = $(
        //       `.losers_icons .bracket_icon.bracket_icon_p${teamId}`
        //     );
        //     if (!icon_element) return;

        //     icon_anim = gsap.timeline();

        //     let found = false;

        //     Object.entries(losersRounds).forEach(([roundKey, round], r) => {
        //       Object.values(round.sets).forEach((slot, i) => {
        //         Object.values(slot.playerId).forEach(
        //           (slotPlayerId, slotIndex) => {
        //             if (slotPlayerId == teamId) {
        //               if (roundKey == "-1") {
        //                 let setElement = $(
        //                   `.round_base_l .slot_${i + 1}.slot_p_${slotIndex}`
        //                 );

        //                 if (setElement && setElement.offset()) {
        //                   icon_anim.set($(icon_element), {
        //                     x:
        //                       setElement.offset().left -
        //                       ($(icon_element).outerWidth() * 3) / 4,
        //                     y:
        //                       setElement.offset().top +
        //                       setElement.outerHeight() / 2 -
        //                       $(icon_element).outerHeight() / 2,
        //                   });
        //                 }

        //                 icon_anim.add(
        //                   AnimateLine(
        //                     $(
        //                       `.lines.win .losers_container.line_base_r_${roundKey}.s_${
        //                         i + 1
        //                       }.p_${slotIndex}.base`
        //                     )
        //                   )
        //                 );
        //               } else if (!found) {
        //                 let setElement = $(
        //                   `.round_${parseInt(roundKey) + 1} .slot_hanging_${
        //                     i + 1
        //                   }`
        //                 );

        //                 icon_anim.add(
        //                   AnimateLine(
        //                     $(
        //                       `.lines.win .losers_container.line_hanging_r_${parseInt(
        //                         roundKey
        //                       )}.s_${2 * i + 1}.base`
        //                     )
        //                   )
        //                 );

        //                 if (setElement && setElement.offset()) {
        //                   icon_anim.set($(icon_element), {
        //                     x:
        //                       setElement.offset().left -
        //                       ($(icon_element).outerWidth() * 3) / 4,
        //                     y:
        //                       setElement.offset().top +
        //                       setElement.outerHeight() / 2 -
        //                       $(icon_element).outerHeight() / 2,
        //                   });
        //                 }
        //               }

        //               let setElement = $(`.round_${roundKey} .slot_${i + 1}`);

        //               if (parseInt(roundKey) % 2 == 0 && slotIndex % 2 == 1) {
        //                 icon_anim.add(
        //                   AnimateLine(
        //                     $(
        //                       `.lines.win .losers_container.line_r_${roundKey}.s_${
        //                         2 * (i + 1)
        //                       }.base`
        //                     )
        //                   )
        //                 );
        //               } else {
        //                 icon_anim.add(
        //                   AnimateLine(
        //                     $(
        //                       `.lines.win .losers_container.line_r_${roundKey}.s_${
        //                         slotIndex + 1
        //                       }.base`
        //                     )
        //                   )
        //                 );
        //               }

        //               if (setElement && setElement.offset()) {
        //                 icon_anim.to($(icon_element), {
        //                   x: setElement.offset().left,
        //                   duration: 1,
        //                 });
        //                 // Only continue if won
        //                 if (
        //                   slot.score[slotIndex] >
        //                   slot.score[(slotIndex + 1) % 2]
        //                 ) {
        //                   if (roundKey == "-1") {
        //                     icon_anim.add(
        //                       AnimateLine(
        //                         $(
        //                           `.lines.win .losers_container.line_base_r_${-1}.s_${
        //                             i + 1
        //                           }.p_${slotIndex}.win`
        //                         )
        //                       )
        //                     );
        //                   } else if (found) {
        //                     icon_anim.add(
        //                       AnimateLine(
        //                         $(
        //                           `.lines.win .losers_container.line_r_${roundKey}.s_${
        //                             slotIndex + 1
        //                           }.win`
        //                         )
        //                       )
        //                     );
        //                   } else {
        //                     icon_anim.add(
        //                       AnimateLine(
        //                         $(
        //                           `.lines.win .losers_container.line_hanging_r_${roundKey}.s_${
        //                             2 * i + 1
        //                           }.win`
        //                         )
        //                       )
        //                     );
        //                   }
        //                   icon_anim.to($(icon_element), {
        //                     x: setElement.offset().left,
        //                     y: setElement.offset().top,
        //                     duration: 1,
        //                   });
        //                 } else {
        //                   // TODO: remove
        //                   icon_anim.fromTo(
        //                     $(icon_element).find(".icon_image"),
        //                     { filter: "brightness(1)" },
        //                     {
        //                       filter: "brightness(.5)",
        //                       duration: 0.4,
        //                     }
        //                   );
        //                 }
        //               }

        //               found = true;
        //             }
        //           }
        //         );
        //       });
        //     });

        //     iconAnimationsL.push(icon_anim);

        //     return;
        //   });
        // });

        return;
      });
    });

    $(".text").each(function (e) {
      FitText($($(this)[0].parentNode));
    });
  }

  Update();
  $(window).on("load", () => {
    $("body").fadeTo(1000, 1000, async () => {
      Start();
      setInterval(Update, 1000);
    });
  });
})(jQuery);
