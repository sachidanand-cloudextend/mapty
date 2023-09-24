'use strict';

// prettier-ignore

class Workout{
    date = new Date();
    id = (Date.now() + '' ).slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/hr
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

// const run1 = new Running([39,-12], 5.2, 24, 178 );
// const cycling1 = new Cycling([39, -12], 27, 95, 523);

// -------------------------------------- APPLICATION ARCHITECTURE ---------------------------
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteAllWorkOut = document.querySelector('.delete-all-container');

class App {
  #workouts = [];
  #map;
  #mapEvent;
  #mapZoomLevel = 13;

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
    deleteAllWorkOut.addEventListener(
      'click',
      this._deleteAllWorkout.bind(this)
    );
    this._setWorkoutsFromLocalStorageOnPageLoad.call(this);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('User blocked the location tracking!!');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(this);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13); // L is kind of namespace provided from leaflet library.

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(w => this._renderWorkoutMarker(w));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // clear out the form
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const areInputsValid = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);
    const { lat, lng } = this.#mapEvent.latlng;
    // Getting data from the form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    let newWorkout;
    // Check if the data is valid or not

    // If workout is running, create the running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !areInputsValid(duration, distance, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input has to be positive numbers');

      newWorkout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling , create the running object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !areInputsValid(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input has to be positive numbers');

      newWorkout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.#workouts.push(newWorkout);
    if (deleteAllWorkOut.classList.contains('hidden')) {
      deleteAllWorkOut.classList.remove('hidden');
    }
    // Add new object to workout arra

    // Render workout as marker on map
    e.preventDefault();

    this._hideForm();

    this._renderWorkoutMarker(newWorkout);
    this._renderWorkout(newWorkout);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
         <h2 class="workout__title">${workout.description}</h2>
         <i class="fa fa-trash workout-delete-icon" aria-hidden="true"></i>
          <div class="workout__details">
            <span class="workout__icon">
            ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
            </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
    if (workout.type === 'running') {
      html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">178</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>
            `;
    }

    if (workout.type === 'cycling') {
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
            `;
    }

    form.insertAdjacentHTML('afterend', html);
    this._setLocalStorage();
  }

  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);
    if (e.target?.classList.contains('workout-delete-icon')) {
      this._deleteWorkout(workout, workoutEl);
    } else {
      workout.click();
      this._updateLocalStorage(workout);

      this.#map.setView(workout.coords, this.#mapZoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }

  _deleteWorkout(workout, workoutEl) {
    if (this.#workouts && this.#workouts.length > 0) {
      workoutEl.style.display = 'none';
      const deleteIndex = this.#workouts.findIndex(w => w.id === workout.id);
      this.#workouts.splice(deleteIndex, 1);
      this._deleteFromLocalStorage(workout);
      if (this.#workouts.length === 0) {
        deleteAllWorkOut.classList.add('hidden');
      }
    }
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _updateLocalStorage(workout) {
    this._deleteFromLocalStorage(workout).push(workout);
    localStorage.setItem('workouts', JSON.stringify(localStorageWorkouts));
  }

  _deleteFromLocalStorage(workout, isDeleteAll = false) {
    const localStorageWorkouts = JSON.parse(localStorage.getItem('workouts'));
    const clickedItemIndex = localStorageWorkouts.findIndex(
      w => w.id === workout.id
    );
    localStorageWorkouts.splice(clickedItemIndex, 1);
    localStorage.setItem('workouts', JSON.stringify(localStorageWorkouts));
    if (!isDeleteAll) {
      setTimeout(() => {
        alert(`${workout.type} workout deleted successfully!!`);
      }, 300);
    }
    return localStorageWorkouts;
  }

  _setWorkoutsFromLocalStorageOnPageLoad() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(w => this._renderWorkout(w));
    if (data.length > 0) {
      deleteAllWorkOut.classList.remove('hidden');
    }
  }

  _deleteAllWorkout() {
    if (this.#workouts && this.#workouts.length > 0) {
      this.#workouts.forEach(w => this._deleteFromLocalStorage(w, true));
      this.#workouts = [];
      this.#map.closePopup();
      containerWorkouts.style.display = 'none';
      setTimeout(() => {
        alert('All workouts deleted successfully!');
      }, 240);
    }
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
