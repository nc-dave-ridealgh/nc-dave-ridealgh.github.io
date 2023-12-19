const form = document.getElementById('instructions-form');
const grid = document.getElementById('grid');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const instructions = document.getElementById('instructions-input').value;
  form.remove();
  const trenchDigger = new TrenchDigger(instructions.split('\n'));
  trenchDigger.traverseDigPlan();
  trenchDigger.mapTrenchOutline();
  trenchDigger.trenchOutline.forEach((line, y) => {
    const row = document.createElement('div');
    row.classList.add('row');
    grid.appendChild(row);
    line.forEach((char, x) => {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.textContent = char;
      if (char === '#') {
        cell.classList.add('border');
      }
      row.appendChild(cell);
      trenchDigger.cells[`${x},${y}`] = cell;
    });
  });
  await trenchDigger.mapTrenchArea();
});

class TrenchDigger {
  constructor(digPlan) {
    this.digPlan = digPlan;
    this.trenchOutline = [];
    this.trenchOutlineCoords = ['0,0'];
    this.trenchArea = [];
    this.x = 0;
    this.y = 0;
    this.minX = 0;
    this.maxX = 0;
    this.minY = 0;
    this.maxY = 0;
    this.cells = {};
  }

  get trenchOutlineString() {
    return this.trenchOutline.map((line) => line.join('')).join('\n');
  }
  get trenchAreaString() {
    return this.trenchArea.map((line) => line.join('')).join('\n');
  }
  get trenchAreaCount() {
    return this.trenchAreaString.match(/#/g).length;
  }

  parseCoord(x, y) {
    return `${x},${y}`;
  }
  parseLine(line, isCorrect = false) {
    const [_, dir, moves, colourCode] = line.match(
      /^([LRUD]) (\d+) \(#([0-9a-f]{6})\)$/
    );
    if (!isCorrect) {
      return [dir, +moves];
    }
    const hexDirections = ['R', 'D', 'L', 'U'];
    const hexDistance = Number.parseInt(colourCode.slice(0, -1), 16);
    const hexDir = Number.parseInt(colourCode.slice(-1), 16);
    return [hexDirections[hexDir], hexDistance];
  }
  move(dir) {
    switch (dir) {
      case 'L':
        this.x--;
        break;
      case 'R':
        this.x++;
        break;
      case 'U':
        this.y--;
        break;
      case 'D':
        this.y++;
        break;
    }
  }
  updateBoundaries() {
    if (this.x < this.minX) {
      this.minX = this.x;
    }
    if (this.x > this.maxX) {
      this.maxX = this.x;
    }
    if (this.y < this.minY) {
      this.minY = this.y;
    }
    if (this.y > this.maxY) {
      this.maxY = this.y;
    }
  }
  updateTrenchOutlineCoords() {
    this.trenchOutlineCoords.push(this.parseCoord(this.x, this.y));
  }
  isTrenchOutlineCoord(coord) {
    return this.trenchOutlineCoords.includes(coord);
  }
  reset() {
    this.trenchOutline = [];
    this.trenchOutlineCoords = ['0,0'];
    this.trenchArea = [];
    this.x = 0;
    this.y = 0;
    this.minX = 0;
    this.maxX = 0;
    this.minY = 0;
    this.maxY = 0;
  }

  traverseDigPlan(isCorrect = false) {
    this.digPlan.forEach((line) => {
      const [dir, moves] = this.parseLine(line, isCorrect);
      for (let i = 0; i < moves; i++) {
        this.move(dir);
        this.updateTrenchOutlineCoords();
      }
      this.updateBoundaries();
    });
  }
  mapTrenchOutline() {
    // console.log('mapping outline');
    const mapLines = [];
    for (let y = this.minY; y <= this.maxY; y++) {
      // console.log('line', y, 'of', this.maxY);
      const line = [];
      for (let x = this.minX; x <= this.maxX; x++) {
        // console.log('column', x, 'of', this.maxX);
        const coord = this.parseCoord(x, y);
        if (this.isTrenchOutlineCoord(coord)) {
          line.push('#');
        } else {
          line.push('.');
        }
      }
      mapLines.push(line);
    }
    this.trenchOutline = mapLines;
    this.trenchArea = mapLines;
  }
  getInsideStartingCoord() {
    for (let y = 0; y < this.trenchOutline.length; y++) {
      const line = this.trenchOutline[y];
      if (line.filter((x) => x === '#').length === 2) {
        return this.parseCoord(line.indexOf('#') + 1, y);
      }
    }
  }

  async mapTrenchArea(startingCoord = this.getInsideStartingCoord()) {
    // console.log('mapping area');
    const stack = [startingCoord];

    while (stack.length > 0) {
      // console.log('stack length:', stack.length);
      const currentCoord = stack.pop();
      const [x, y] = currentCoord.split(',').map(Number);
      if (this.trenchArea[y][x] !== '#') {
        this.trenchArea[y][x] = '#';
        this.cells[currentCoord].classList.add('active');
        this.cells[currentCoord].textContent = '#';
        await this.timer(1);
        stack.push(this.parseCoord(x, y - 1)); // U
        stack.push(this.parseCoord(x, y + 1)); // D
        stack.push(this.parseCoord(x - 1, y)); // L
        stack.push(this.parseCoord(x + 1, y)); // R
      }
    }
  }

  async timer(time) {
    return new Promise((res) => {
      setTimeout(res, time);
    });
  }
}
