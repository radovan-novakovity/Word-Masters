// getting all the letters from the DOM, creates a Nodelist which is ordered
const letters = document.querySelectorAll('.scoreboard-letter');
// grabbing the loading emoji
const loadingDiv = document.querySelector('.info-bar');
const ANSWER_LENGTH = 5;
const ROUNDS = 6;

async function init() {
    let currentGuess ='';
    let currentRow = 0;
    let isLoading = true;


    // getting the word of the day that needs to be guessed by the user (res == response)
    const res = await fetch("https://words.dev-apis.com/word-of-the-day")
    // response object
    /* this can be also: const { word } = await res.json(); -> destructuring 
    we know there is a property called 'word' pull it out and call it word */
    const resObj = await res.json();
    const word = resObj.word.toUpperCase();

    // taking the word of the day, splitting it up by letters into an array to use with 'guessParts'
    const Wordparts = word.split("");
    let done = false;
    setLoading(false);
    isLoading = false;

    // console.log(word)

    function addLetter (letter) {
        if (currentGuess.length < ANSWER_LENGTH) {
            // add letter to the end
            currentGuess += letter;
        } else {
            // when there is 5 letters already, if the user type a new number, the last one is replaced
            currentGuess = currentGuess.substring(0, currentGuess.length -1) + letter;
        }

        // this will give whatever square we are looking at, and writing the letter in it
        // answer_length * currebt row to change to next row because the next row doesnt start with 0, but 5 then 10 ect...
        letters[ANSWER_LENGTH * currentRow + currentGuess.length - 1].innerText = letter;
    }

    async function commit() {
        if (currentGuess.length != ANSWER_LENGTH) {
            // if they hit enter before writing in all the squares, it does nothing
            return;
        }

        
        isloading = true;
        setLoading(true);
        // sending a POST request to the API, is this a valid 5 letter word
        const res = await fetch("https://words.dev-apis.com/validate-word", {
            method: "POST",
            body: JSON.stringify({ word: currentGuess })
        });

        const resObj = await res.json();
        const validWord = resObj.validWord;
        // const { validWord } = resObj;

        isLoading = false;
        setLoading(false);

        if (!validWord) {
            markInvalidWord();
            /* the return makes sure that the game doesnt let the user type in the next row, 
            instead makes them delete the invalid word and try again */
            return;
        }

        // taking the guessed word and putting all the letters of it in an array
        const guessParts = currentGuess.split("");
        // making a map data type of the word of the day, checking how many are there of each letters
        const map = makeMap(Wordparts);

        for (let i = 0; i < ANSWER_LENGTH; i++) {
            // mark as correct
            if (guessParts[i] === Wordparts[i]) {
                letters[currentRow * ANSWER_LENGTH + i].classList.add("correct");
                /* after guessing a letter correctly in a certain position, 
                it helps to check later if there is a same letter left to mark as close */
                map[guessParts[i]]--;
            }
        }

        for (let i = 0; i < ANSWER_LENGTH; i++) {
            if (guessParts[i] === Wordparts[i]) {
                // do nothing, we already did it
            } else if (Wordparts.includes(guessParts[i]) && map[guessParts[i]] > 0) {
                /* if the word of the day includes the guessed letter, and if one is already guessed correctly, 
                and there are more of the same letter, mark as close */
                letters[currentRow * ANSWER_LENGTH + i].classList.add("close");
                map[guessParts[i]]--;
            } else {
                /* if the word of the day includes the guessed letter, and if one is already guessed correctly, 
                and there are no more of the same letter, mark as wrong */
                letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
            }
        }

        currentRow++;
        
        if (currentRow === ROUNDS) {
            alert(`you loose, the word was ${word}`)
            done = true;
        } else if (currentGuess === word) {
            alert('you win!');
            // adding the colored logo effect with the 'winner' class
            document.querySelector('.brand').classList.add("winner");
            done = true;
            return;
        }
        currentGuess = '';
    }

    function backspace() {
        // hitting backspace deletes the last letter
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        // replacing the last letter with an empty string
        letters[ANSWER_LENGTH * currentRow + currentGuess.length].innerText = "";
    }

    function markInvalidWord() {
        //alert("not a valid word");

        for (let i = 0; i < ANSWER_LENGTH; i++) {
            /* if there is invalid class added before, remove it, 
            so it can be added for the flash effect else it will not flash for the next invalid word */
            letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");

            /* the invalid class has to be added for the flashing, 
            this function executes adding the class for the flash effect after 10 miliseconds */
            setTimeout(function () {
                letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid");
            }, 10);
        }
    }

    // keydown is needed to check for backspace and enter, it doesnt activate on keypress
    document.addEventListener('keydown', function handleKeyPress (event) {
        if (done || isLoading) {
            // if the user wins or looses, or its loading it will not register keypress
            return;
        }



        const action = event.key;

        if (action === 'Enter') {
            commit();
        } else if (action === 'Backspace') {
            backspace();
        } else if (isLetter(action)) {
            addLetter(action.toUpperCase())
        } else {
            // if its not a letter, backspace, enter, do nothing
        }
    });
}

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

function setLoading(isLoading) {
    // if loading is true toggle will add the 'show' class, if false it will remove it 
    loadingDiv.classList.toggle('show', isLoading);
}

function makeMap (array) {
    // creates an object
    const obj = {};
    for (let i = 0; i < array.length; i++) {
        const letter = array[i];
        // if the letter exists, it will return true
        if (obj[letter]) {
            // if the letter is already exists in the users guess, increment the letter's number
            obj[letter]++;
        } else {
            obj[letter] = 1;
        }
    }

    return obj;
}

init();