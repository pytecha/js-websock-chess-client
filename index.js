(function () {
    'use strict';

    function initBoard() {
        for (let i = 0, j; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                const pc = document.getElementById(TILES[i][j]);
                if (i == 0 || i == 7) {
                    const idx = (j == 0 || j == 7) ? 2 :
                        (j == 1 || j == 6) ? 4 :
                            (j == 2 || j == 5) ? 3 :
                                j == 3 ? 1 : 0;
                    pc.innerHTML = `<span class="${i > 1 ? 'white' : 'black'}" data-info="${idx}${Number(i > 1)}">${CMUND[idx]}</span>`;
                } else if (i == 1 || i == 6) {
                    pc.innerHTML = `<span class="${i > 1 ? 'white' : 'black'}" data-info="5${Number(i > 1)}">${CMUND[5]}</span>`;
                } else {
                    pc.innerHTML = '<span class="" data-info=""></span>';
                }
            }
        }
        const players = gameBoard.querySelectorAll(".player");
        players[0].classList.remove("active");
        players[1].classList.add("active");
    }

    function startGame() {
        gameBoard.querySelector("#play-grid").style.pointerEvents = "initial";
        document.getElementById(gameBoard.dataset.prev)?.classList?.remove("shade");

        GAMESTATUS = 0;

        initBoard();

        gameBoard.classList[PLAYAS ? "remove" : "add"]("flip");

        TIMER[1] = { min: TIMER.time - 1, sec: 59, cs: 99 };
        TIMER[0] = { min: TIMER.time - 1, sec: 59, cs: 99 };

        TIMERID = setInterval(function () {
            if (TIMER.start) {
                const turn = MOVE.turn;
                const timer = TIMER[turn];
                const domObj = gameBoard.querySelector(`#${turn ? "white" : "black"}-player`);
                domObj.lastElementChild.firstElementChild.innerText = timer.min.toString().padStart(2, "0");
                domObj.lastElementChild.lastElementChild.innerText = timer.sec.toString().padStart(2, "0");
                if (--timer.cs < 0) {
                    domObj.lastElementChild.childNodes[1].classList.toggle("blink");
                    timer.cs = 99;
                    if (--timer.sec < 0) {
                        timer.sec = 59
                        if (--timer.min < 0) {
                            if (PLAYAS == turn) {
                                ws.send("5;6");
                                showAlerts({ msg1: `${PLAYAS ? "White" : "Black"} timed out`, msg2: "GAME OVER!" });
                            }
                            stopGame();
                        }
                    }
                }
            }
        }, 10);
    }

    function stopGame() {
        clearInterval(TIMERID);
        gameBoard.querySelector("#play-grid").style.pointerEvents = "none";
        gameBoard.querySelectorAll(".player").forEach(
            c => c.lastElementChild.childNodes[1].classList.remove("blink")
        );
        GAMEON = false;
        TIMER.start = false;
        MOVE.turn = 1;
        WHITEMOVED = false;
        GAMESTATUS = 0;
        MATCH = '';
    }

    function showAlerts({ msg1 = '', msg2 = '' }) {
        if (msg1) {
            const node = document.createElement("span");
            node.innerText = msg1;
            node.classList.add("info");
            document.getElementById("game-status").appendChild(node);
            node.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        if (msg2) {
            const node = document.createElement("span");
            node.innerText = msg2;
            node.classList.add("danger");
            document.getElementById("game-status").appendChild(node);
            node.scrollIntoView({ behavior: "smooth", block: "nearest" });

        }
    }

    function makeMove(status, __frm, __to) {
        if (status.length < 2) {
            if (status == "9") {
                const node = document.querySelector("#game-status #confirm-req");
                node.firstElementChild.innerText = "Draw offer recieved";
                node.setAttribute("data-draw", "");
                node.classList.add("show");
                node.scrollIntoView({ behavior: "smooth" });
            } else if (status == "4") {
                ws.send("5;4.");
                stopGame();
                showAlerts({ msg1: "Draw offer accepted", msg2: "GAME OVER!" });
            } else if (status == "a") {
                showAlerts({ msg1: "Draw offer declined" })
            } else {
                ws.send("5;" + status + '.');
                stopGame();
                showAlerts({ msg1: `${PLAYAS ? "Black" : "White"} ${["left", "timed out", "resigned"][7 - status] ?? ''}`, msg2: "GAME OVER!" });
            }
            return;
        }
        const [kind, prmtd, ispromo, gmstatus] = status.split("").map(val => parseInt(val));
        if (gmstatus < 4) {
            let frm = document.getElementById(__frm);
            const to = document.getElementById(__to)
            to.innerHTML = frm.innerHTML;
            document.getElementById(gameBoard.dataset.prev)?.classList?.remove("shade");
            gameBoard.dataset.prev = __to;
            to.classList.add("shade");
            frm.innerHTML = '<span class="" data-info=""></span>';
            if (kind == 1) {
                document.getElementById(__to[0] + (parseInt(__to[1]) + (MOVE.turn ? -1 : 1)))
                    .innerHTML = '<span class="" data-info=""></span>';
            } else if (kind == 2) {
                frm = document.getElementById("h" + (MOVE.turn ? '1' : '8'));
                document.getElementById("f" + (MOVE.turn ? '1' : '8'))
                    .innerHTML = frm.innerHTML;
                frm.innerHTML = '<span class="" data-info=""></span>';
            } else if (kind == 3) {
                frm = document.getElementById("a" + (MOVE.turn ? '1' : '8'));
                document.getElementById("d" + (MOVE.turn ? '1' : '8'))
                    .innerHTML = frm.innerHTML;
                frm.innerHTML = '<span class="" data-info=""></span>';
            }

            if (ispromo) {
                to.innerHTML = `<span class="${MOVE.turn ? 'white' : 'black'}" data-info="${prmtd}${MOVE.turn}">${CMUND[prmtd]}</span>`;
            }


            if (gmstatus < 2) {
                const players = gameBoard.querySelectorAll(".player");
                players.forEach(c => c.classList.toggle("active"));
                players[MOVE.turn].lastElementChild.childNodes[1].classList.remove("blink");
                if (gmstatus == 1) {
                    showAlerts({ msg2: `${MOVE.turn ? "BLACK" : "WHITE"} CHECKED!` });
                }
            } else if (gmstatus == 2 || gmstatus == 3) {
                stopGame();
                showAlerts({ msg1: gmstatus == 2 ? `Checkmate: ${MOVE.turn ? "White" : "Black"} won!` : "Stalemate", msg2: "GAME OVER!" });
            }

            MOVE.turn = Number(!MOVE.turn);

        }
    }

    const CMUND = ["\u265a", "\u265b", "\u265c", "\u265d", "\u265e", "\u265f"];

    const TILES = [
        ["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"],
        ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"],
        ["a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6"],
        ["a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5"],
        ["a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4"],
        ["a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3"],
        ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
        ["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]
    ];

    const gameBoard = document.getElementById("game-board");

    let USER_ID, PLAYAS, MATCH, TIMERID, WHITEMOVED, GAMEON, GAMESTATUS;

    const MOVE = { turn: 1 };

    const TIMER = { start: false, time: 3 };

    initBoard();

    const ws = new WebSocket('ws://localhost:5000');

    ws.addEventListener('open', function (event) {
        console.log('Connected to WebSocket server');
    });
    ws.addEventListener('message', function (event) {
        if (event.data[0] == '0') {
            USER_ID = event.data.slice(2);
        } else if (event.data[0] == '5') {
            makeMove(event.data.slice(2), MOVE.frm, MOVE.to);
        } else if (event.data[0] == '4') {
            if (!TIMER.start) {
                TIMER.start = true;
                WHITEMOVED = true;
            }
            ws.send(event.data.slice(0, 8));
            makeMove(event.data.slice(8), event.data.slice(4, 6), event.data.slice(6, 8));
        } else if (event.data[0] == '2') {
            MATCH = event.data.slice(2);
            const node = document.querySelector("#game-status #confirm-req");
            node.firstElementChild.innerText = "Match offer recieved";
            node.classList.add("show");
            node.scrollIntoView({ behavior: "smooth" });
        } else if (event.data[0] == '1') {
            const i = event.data.slice(2).split(";")[0];
            const node = document.createElement("span");
            console.log(JSON.stringify(event.data));
            node.setAttribute("data-match", event.data.slice(2));
            node.innerHTML = `<span data-msub="">${i.slice(1).padStart(2, "0") + ":00"}</span><span class="${i[0] == '1' ? "black" : "white"}" data-msub="">${CMUND[0]}</span><span data-msub="">Anonymous</span>`
            gameBoard.querySelector("#game-lobby").children[1].appendChild(node);
            setTimeout(function () { node.scrollIntoView({ behavior: "smooth", block: "nearest" }) }, 100);
        } else if (event.data[0] == '3') {
            GAMEON = true;
            if (!MATCH) {
                ws.send(event.data);
                showAlerts({ msg1: "Match offer accepted" });
            }
            PLAYAS = parseInt(event.data[2]);
            TIMER.time = parseInt(event.data.slice(3, event.data.lastIndexOf(';')));
            gameBoard.querySelectorAll(".player").forEach(c => {
                c.classList.remove("active");
                c.lastElementChild.firstElementChild.innerText = TIMER.time.toString().padStart(2, "0");
                c.lastElementChild.lastElementChild.innerText = "00";
            });
            startGame();
        }
        console.log('Received message from server:', event.data);
    });

    ws.addEventListener('error', function (event) {
        console.log('WebSocket encountered an error');
    });

    ws.addEventListener('close', function (event) {
        console.log('Connection to WebSocket server closed');
    });

    gameBoard.addEventListener("click", function (e) {
        e.stopPropagation();

        if (e.target.tagName == "SPAN") {
            if (e.target.hasAttribute("data-info")) {
                if (!GAMEON || (!PLAYAS && !WHITEMOVED)) return;
                this.querySelector("#promo").style.display = "none";
                if (this.dataset.prev) {
                    this.querySelector('#' + this.dataset.prev).classList.remove("shade");
                    this.dataset.prev = '';
                }
                const curr = this.dataset.curr;
                const next = e.target.parentElement.id;

                if (curr) {
                    const currEle = this.querySelector('#' + curr);
                    const currInfo = currEle.firstElementChild.dataset.info;
                    this.dataset.curr = '';
                    this.dataset.prev = next;
                    if (currInfo && currInfo[1] == PLAYAS) {
                        TIMER.start = true;
                        MOVE.pcat = currInfo[0];
                        MOVE.frm = curr;
                        MOVE.to = next;
                        if (currInfo[0] == '5' && (next[1] == '1' || next[1] == '8')) {
                            this.querySelector("#promo").style.display = "flex";
                            currEle.classList.remove("shade");
                            e.target.parentElement.classList.add("shade");
                            return;
                        }
                        ws.send('4;@' + currInfo[0] + curr + next);
                    }
                    if (curr == next) {
                        e.target.parentElement.classList.toggle("shade");
                        return;
                    }
                    currEle.classList.remove("shade");
                    e.target.parentElement.classList.add("shade");
                } else {
                    this.dataset.curr = next;
                    e.target.parentElement.classList.add("shade");
                }
            } else if (e.target.hasAttribute("data-promo")) {
                ws.send('4;@' + MOVE.pcat + MOVE.frm + MOVE.to + '=' + " QRBN"[e.target.dataset.promo]);
                e.target.parentElement.style.display = "none";
            } else if (e.target.hasAttribute("data-msub")) {
                ws.send("1;" + e.target.parentElement.dataset.match);
                showAlerts({ msg1: "Match offer sent" });
            }
        } else if (e.target.tagName == "BUTTON") {
            const gpEle = e.target.parentElement.parentElement;
            if (e.target.id.endsWith("create")) {
                const side = gpEle.querySelector("#gc-play-as").elements["side"].value;
                const time = gpEle.querySelector("#gc-time").children["duration"].value;
                if (time < 1 || time > 30) return;
                ws.send("0;" + (side.length ? side : (Math.random() > 0.5 ? '1' : '0')) + time + ';' + USER_ID);
                showAlerts({ msg1: "Game created" });
            }
            gpEle.classList.remove("show");
        }
    });

    document.getElementById("game-aux").addEventListener("click", function (e) {
        e.stopPropagation();
        const eId = e.target.id;
        if (e.target.tagName == "BUTTON") {
            const node = this.querySelector("#confirm-req");
            if (eId.endsWith("accept")) {
                if (node.hasAttribute("data-draw")) {
                    ws.send("5;4");
                    node.removeAttribute("data-draw");
                    stopGame();
                    showAlerts({ msg1: "Draw offer accepted", msg2: "GAME OVER!" })
                } else {
                    ws.send("2;" + MATCH);
                    showAlerts({ msg1: "Match offer accepted" })
                }
            }
            if (node.hasAttribute("data-draw")) {
                ws.send("5;a");
                showAlerts({ msg1: "Draw offer declined" });
            } else if (eId.endsWith("decline")) {
                showAlerts({ msg1: "Match offer declined" })
            }
            node.classList.remove("show");
        } else if (eId.startsWith("ml-")) {
            if (GAMEON && eId.endsWith("leave")) {
                ws.send('5;7');
                stopGame();
                showAlerts({ msg1: `${PLAYAS ? "White" : "Black"} left`, msg2: "GAME OVER!" });
            } else if(eId.endsWith('lobby') || (!GAMEON && eId.endsWith('create'))) {
                gameBoard.querySelector(`#game-${eId.slice(3)}`).classList.toggle("show");
            }
            e.target.parentElement.classList.remove("show");
        } else if (eId.startsWith("ga-")) {
            if (eId.endsWith("menu")) {
                e.target.previousElementSibling.classList.toggle("show");
            } else if (eId.endsWith("draw") && GAMEON && (GAMESTATUS == 0 || GAMESTATUS == 9)) {
                ws.send("5;9");
                showAlerts({ msg1: "Draw offer sent" });
                GAMESTATUS = 9;
            } else if (eId.endsWith("resign") && GAMEON && (GAMESTATUS == 0 || GAMESTATUS == 9)) {
                ws.send("5;5");
                stopGame();
                showAlerts({ msg1: `${PLAYAS ? "White" : "Black"} resigned`, msg2: "GAME OVER!" });
            } else if (eId.endsWith("flip"))
                gameBoard.classList.toggle("flip");
        }
    });

})();