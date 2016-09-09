'use strict'
$(function () {
  var user = new User()
    , casino = new Casino()

    , $settingsButton = $('.settings-button')
    , $credit = $('.credit')
    , $startButton = $('.start-button')
    , $exitButton = $('.exit-button')
    , $settings = $('.settings')
    , $chosenSlotIndex = $settings.find('.chosen-slot').find('input')
    , $slotMachine = $('.slot-machine')
    , $slotMoney = $slotMachine.find('.slot-money')
    , $numbers = $slotMachine.find('.numbers').find('.number')
    , $putMoneyBox = $slotMachine.find('.put-money-box').find('input')
    , refreshSlotHTML = function (slotMoney, numbers) {
        slotMoney = parseFloat(slotMoney, 10);

        if (!isNaN(slotMoney) && typeof numbers === 'string') {
          $numbers.each(function (index, item) {
            $(item).text(numbers[index]);
          });

          $slotMoney.text(slotMoney);
        }
      }
    , chosenSlotValidation = function (value) {
        var min = 1
          , max = casino.getSlotMachinesNumber();
        value = parseInt(value, 10);

        if (isNaN(value) || value < min || value > max) {
          value = user.slotIndex;
        }
        return value;
    }
    , showMessageBox = function(message) {
        $exitButton.after($('<div id="message">' + message + '</div>'));
        setTimeout(function () {
          $exitButton.siblings('div#message').remove();
        }, 4000);
    };

  $settingsButton.on('click', function() {
    $settings.find('.slots-amount').text(casino.getSlotMachinesNumber());
    $chosenSlotIndex.attr('max', casino.getSlotMachinesNumber());
    $chosenSlotIndex.val(user.slotIndex + 1);
    $settings.toggleClass('invisible');
  });

  $settings.find('.save-button').on('click', function () {
    var slot;
    user.slotIndex = chosenSlotValidation($chosenSlotIndex.val()) - 1;
    slot = casino.allSlotMachines[user.slotIndex];

    refreshSlotHTML(slot.getMoney(), '123');

    $settings.addClass('invisible');
  });

  $startButton.on('click', function () {
    var slot = casino.allSlotMachines[user.slotIndex];

    $credit.text(user.credit);
    refreshSlotHTML(slot.getMoney(), '123');

    $(this).addClass('invisible');
    $slotMachine.removeClass('invisible');
    $exitButton.removeClass('invisible');
  });

  $exitButton.on('click', function () {
    user = new User();
    casino = new Casino();

    $settings.find('.slots-amount').text(casino.getSlotMachinesNumber());
    $chosenSlotIndex.attr('max', casino.getSlotMachinesNumber());
    $chosenSlotIndex.val(1);

    $slotMachine.addClass('invisible');
    $exitButton.addClass('invisible');
    $startButton.removeClass('invisible');
  });

  $slotMachine.find('.play-button').on('click', function () {
    var casinoMoney = 1000000
    , putMoney = parseFloat($putMoneyBox.val(), 10)
    , slot = casino.allSlotMachines[user.slotIndex]
    , result
    , message;

    if (!isNaN(putMoney) && putMoney > 0 && putMoney <= user.credit) {
      if (casino.getAllMoney() < putMoney * 5) {
        casino = new Casino(casinoMoney, casino.getSlotMachinesNumber());
        slot = casino.allSlotMachines[user.slotIndex];
        refreshSlotHTML(slot.getMoney(), '123');
        message = 'We have updated casino cash';
        showMessageBox(message);
        return;
      }
      if (!slot.getMoney()) {
        casino.removeSlotMachine(user.slotIndex);
        casino.addSlotMachine();
        slot = casino.allSlotMachines[user.slotIndex];
        refreshSlotHTML(slot.getMoney(), '123');
        message = 'This slot hasn\'t had money. We have moved you to another.';
        showMessageBox(message);
        return;
      }

      result = slot.play(putMoney, casino);
      user.credit -= putMoney;
      user.credit += result.win;

      $credit.text(user.credit);
      refreshSlotHTML(slot.getMoney(), result.number);
    }
  });
});

function User(credit, chosenSlotIndex) {
  var DEFAULT_CREDIT = 1000
    , DEFAULT_SLOT = 0;

  credit = parseInt(credit, 10);
  chosenSlotIndex = parseInt(chosenSlotIndex, 10);

  if (isNaN(credit) || !credit) {
    credit = DEFAULT_CREDIT;
  }

  if (isNaN(chosenSlotIndex)) {
    chosenSlotIndex = DEFAULT_SLOT;
  }
  this.credit = credit;
  this.slotIndex = chosenSlotIndex;
}

function Casino(allMoney, slotMachinesAmount) {
  var DEFAULT_MONEY = 1000000
    , DEFAULT_SLOTS_AMOUNT = 5
    , createSlotMachines;

  allMoney = parseFloat(allMoney, 10);
  slotMachinesAmount = parseInt(slotMachinesAmount, 10);

  this.allSlotMachines = [];

  if (isNaN(allMoney) || !allMoney) {
    allMoney = DEFAULT_MONEY;
  }
  if (isNaN(slotMachinesAmount) || !slotMachinesAmount) {
    slotMachinesAmount = DEFAULT_SLOTS_AMOUNT;
  }

  createSlotMachines = function () {
    var slotMachines = this.allSlotMachines
      , money = parseInt(allMoney / slotMachinesAmount, 10)
      , remainder = allMoney % slotMachinesAmount
      , temp = money + remainder
      , isLucky = false
      , luckyIndex = parseInt(Math.random() * slotMachinesAmount, 10)
      , index;

    if (luckyIndex === 0) {
      isLucky = true;
    }

    slotMachines.push(new SlotMachine(temp, this, isLucky));

    for(index = 1; index < slotMachinesAmount; index++) {
      if (luckyIndex === index) {
        isLucky = true;
      } else {
        isLucky = false;
      }
      slotMachines.push(new SlotMachine(money, this, isLucky));
    }
  }

  createSlotMachines.call(this);
}

Casino.prototype.getSlotMachinesNumber = function () {
  return this.allSlotMachines.length;
}

Casino.prototype.getAllMoney = function () {
  var allMoney = this.allSlotMachines.reduce(function (money, item) {
    return money + item.getMoney();
  }, 0);
  return allMoney;
}

Casino.prototype.addSlotMachine = function () {
  var slotMachines = this.allSlotMachines
    , maxSlotMachine = slotMachines.reduce(function (max, item) {
        if (max.getMoney() < item.getMoney()) {
          max = item;
        }
        return max;
      })
    , money = parseInt(maxSlotMachine.getMoney() / 2, 10);

  slotMachines.push(new SlotMachine(money, this));
  maxSlotMachine.takeMoney(money);
}

Casino.prototype.removeSlotMachine = function (index) {
  var slotMachines, money, part, remainder, slotMachinesAmount;
  index = parseInt(index, 10);

  if (!isNaN(index) && index < this.getSlotMachinesNumber()) {
    slotMachines = this.allSlotMachines;
    money = slotMachines[index].getMoney();

    slotMachines.splice(index, 1);

    if (money) {
      slotMachines = [];
      slotMachines = slotMachines.concat(this.allSlotMachines);
      slotMachines.sort(function (slot1, slot2) {
        return slot1.getMoney() - slot2.getMoney();
      });

      slotMachinesAmount = this.getSlotMachinesNumber();
      part = parseInt(money / slotMachinesAmount, 10)
      remainder = money % slotMachinesAmount;
        
      if (part) {
        slotMachines.forEach(function (item) {
          item.putMoney(part);
        });
        slotMachines[0].putMoney(remainder);
      } else {
        slotMachines[0].putMoney(money);
      }
    }
  }
}

Casino.prototype.takeMoney = function (money) {
  var temp = false, slotMachines = [];

  if (money > 0) {
    slotMachines = slotMachines.concat(this.allSlotMachines);
    slotMachines.sort(function (slot1, slot2) {
      return slot2.getMoney() - slot1.getMoney();
    });

    slotMachines.every(function (item) {
      var diff = item.getMoney() - money;

      if (diff < 0) {
        item.takeMoney(money + diff, this);
        money = -diff;
        temp = true;
      }
      return temp;
    });
  } else {
    money = 0;
  }
}

function SlotMachine(money, casino, isLucky) {
  var _money, _casino;
  money = parseFloat(money, 10);

  if (!isNaN(money) && casino instanceof Casino) {
    _money = money;
    _casino = casino;

    this.lucky = !!isLucky;

    this.getMoney = function () {
      return _money;
    }

    this.takeMoney = function (cash) {
      var remainderMoney;
      cash = parseFloat(cash, 10);
      if (!isNaN(cash) && cash > 0) {
        if (_money < cash) {
          remainderMoney = cash - _money;
          _casino.takeMoney(remainderMoney);
          _money = 0;
        } else {
          _money -= cash;
        }
      }
    }

    this.putMoney = function (cash) {
      if (money > 0) {
        _money += cash;
      }
    }
  }
}

SlotMachine.prototype.play = function (money) {
  var number = '';

  if (money > 0) {
    this.putMoney(money);
    if (this.lucky) {
      number = '777';
    } else {
      number += parseInt(Math.random() * 900 + 100, 10);
    }

    if (number === '777') {
      money = this.getMoney();
    } else {
      money = this.calculateWin(number, money);
    }
    this.takeMoney(money);
  } else {
    money = 0;
  }
  return {number: number, win: money};
}

SlotMachine.prototype.calculateWin = function (number, money) {
  var counter = 0, i, j;

  for(i = 0; i < number.length - 1; i++) {
    for (j = i + 1; j < number.length; j++) {
      if (number[i] === number[j]) {
        counter++;
      }
    }
  }
  switch(counter) {
    case 0: money = 0;
    break;
    case 1: money *= 2;
    break;
    case 3: money *= 5;
    break;
    default:
    break;
  }
  return money;
}