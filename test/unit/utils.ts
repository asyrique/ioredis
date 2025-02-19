import * as sinon from "sinon";
import { expect } from "chai";
import * as utils from "../../lib/utils";

describe("utils", function () {
  describe(".bufferEqual", function () {
    it("should return correctly", function () {
      expect(utils.bufferEqual(Buffer.from("123"), Buffer.from("abc"))).to.eql(
        false
      );
      expect(utils.bufferEqual(Buffer.from("abc"), Buffer.from("abc"))).to.eql(
        true
      );
      expect(utils.bufferEqual(Buffer.from("bc"), Buffer.from("abc"))).to.eql(
        false
      );
      expect(utils.bufferEqual(Buffer.from(""), Buffer.from(""))).to.eql(true);
    });

    it("should work when Buffer#equals not exists", function () {
      const equals = Buffer.prototype.equals;
      delete Buffer.prototype.equals;
      expect(utils.bufferEqual(Buffer.from("123"), Buffer.from("abc"))).to.eql(
        false
      );
      expect(utils.bufferEqual(Buffer.from("abc"), Buffer.from("abc"))).to.eql(
        true
      );
      expect(utils.bufferEqual(Buffer.from("bc"), Buffer.from("abc"))).to.eql(
        false
      );
      expect(utils.bufferEqual(Buffer.from(""), Buffer.from(""))).to.eql(true);
      Buffer.prototype.equals = equals;
    });
  });

  describe(".convertBufferToString", function () {
    it("should return correctly", function () {
      expect(utils.convertBufferToString(Buffer.from("123"))).to.eql("123");
      expect(
        utils.convertBufferToString([Buffer.from("abc"), Buffer.from("abc")])
      ).to.eql(["abc", "abc"]);
      expect(
        utils.convertBufferToString([
          Buffer.from("abc"),
          [[Buffer.from("abc")]],
        ])
      ).to.eql(["abc", [["abc"]]]);
      expect(
        utils.convertBufferToString([
          Buffer.from("abc"),
          5,
          "b",
          [[Buffer.from("abc"), 4]],
        ])
      ).to.eql(["abc", 5, "b", [["abc", 4]]]);
    });
  });

  describe(".wrapMultiResult", function () {
    it("should return correctly", function () {
      expect(utils.wrapMultiResult(null)).to.eql(null);
      expect(utils.wrapMultiResult([1, 2])).to.eql([
        [null, 1],
        [null, 2],
      ]);

      const error = new Error("2");
      expect(utils.wrapMultiResult([1, 2, error])).to.eql([
        [null, 1],
        [null, 2],
        [error],
      ]);
    });
  });

  describe(".isInt", function () {
    it("should return correctly", function () {
      expect(utils.isInt(2)).to.eql(true);
      expect(utils.isInt("2231")).to.eql(true);
      expect(utils.isInt("s")).to.eql(false);
      expect(utils.isInt("1s")).to.eql(false);
      expect(utils.isInt(false)).to.eql(false);
    });
  });

  describe(".packObject", function () {
    it("should return correctly", function () {
      expect(utils.packObject([1, 2])).to.eql({ 1: 2 });
      expect(utils.packObject([1, "2"])).to.eql({ 1: "2" });
      expect(utils.packObject([1, "2", "abc", "def"])).to.eql({
        1: "2",
        abc: "def",
      });
    });
  });

  describe(".timeout", function () {
    it("should return a callback", function (done) {
      let invoked = false;
      const wrappedCallback1 = utils.timeout(function () {
        invoked = true;
      }, 0);
      wrappedCallback1();

      let invokedTimes = 0;
      var wrappedCallback2 = utils.timeout(function (err) {
        expect(err.message).to.match(/timeout/);
        invokedTimes += 1;
        wrappedCallback2();
        setTimeout(function () {
          expect(invoked).to.eql(true);
          expect(invokedTimes).to.eql(1);
          done();
        }, 0);
      }, 0);
    });
  });

  describe(".convertObjectToArray", function () {
    it("should return correctly", function () {
      const nullObject = Object.create(null);
      nullObject.abc = "def";
      expect(utils.convertObjectToArray(nullObject)).to.eql(["abc", "def"]);
      expect(utils.convertObjectToArray({ 1: 2 })).to.eql(["1", 2]);
      expect(utils.convertObjectToArray({ 1: "2" })).to.eql(["1", "2"]);
      expect(utils.convertObjectToArray({ 1: "2", abc: "def" })).to.eql([
        "1",
        "2",
        "abc",
        "def",
      ]);
    });
  });

  describe(".convertMapToArray", function () {
    it("should return correctly", function () {
      if (typeof Map !== "undefined") {
        expect(utils.convertMapToArray(new Map([["1", 2]]))).to.eql(["1", 2]);
        expect(utils.convertMapToArray(new Map([[1, 2]]))).to.eql([1, 2]);
        expect(
          utils.convertMapToArray(
            new Map<number | string, string>([
              [1, "2"],
              ["abc", "def"],
            ])
          )
        ).to.eql([1, "2", "abc", "def"]);
      }
    });
  });

  describe(".toArg", function () {
    it("should return correctly", function () {
      expect(utils.toArg(null)).to.eql("");
      expect(utils.toArg(undefined)).to.eql("");
      expect(utils.toArg("abc")).to.eql("abc");
      expect(utils.toArg(123)).to.eql("123");
    });
  });

  describe(".optimizeErrorStack", function () {
    it("should return correctly", function () {
      const error = new Error();
      const res = utils.optimizeErrorStack(
        error,
        new Error().stack + "\n@",
        __dirname
      );
      expect(res.stack.split("\n").pop()).to.eql("@");
    });
  });

  describe(".parseURL", function () {
    it("should return correctly", function () {
      expect(utils.parseURL("/tmp.sock")).to.eql({ path: "/tmp.sock" });
      expect(utils.parseURL("127.0.0.1")).to.eql({ host: "127.0.0.1" });
      expect(utils.parseURL("6379")).to.eql({ port: "6379" });
      expect(utils.parseURL("127.0.0.1:6379")).to.eql({
        host: "127.0.0.1",
        port: "6379",
      });
      expect(utils.parseURL("127.0.0.1:6379?db=2&key=value")).to.eql({
        host: "127.0.0.1",
        port: "6379",
        db: "2",
        key: "value",
      });
      expect(
        utils.parseURL("redis://user:pass@127.0.0.1:6380/4?key=value")
      ).to.eql({
        host: "127.0.0.1",
        port: "6380",
        db: "4",
        password: "pass",
        username: "user",
        key: "value",
      });
      expect(utils.parseURL("redis://127.0.0.1/")).to.eql({
        host: "127.0.0.1",
      });
      expect(
        utils.parseURL("rediss://user:pass@127.0.0.1:6380/4?key=value")
      ).to.eql({
        host: "127.0.0.1",
        port: "6380",
        db: "4",
        password: "pass",
        username: "user",
        key: "value",
      });
    });
  });

  describe(".sample", function () {
    it("should return a random value", function () {
      let stub = sinon.stub(Math, "random").callsFake(() => 0);
      expect(utils.sample([1, 2, 3])).to.eql(1);
      expect(utils.sample([1, 2, 3], 1)).to.eql(2);
      expect(utils.sample([1, 2, 3], 2)).to.eql(3);
      stub.restore();

      stub = sinon.stub(Math, "random").callsFake(() => 0.999999);
      expect(utils.sample([1, 2, 3])).to.eql(3);
      expect(utils.sample([1, 2, 3], 1)).to.eql(3);
      expect(utils.sample([1, 2, 3], 2)).to.eql(3);
      stub.restore();
    });
  });

  describe(".shuffle", function () {
    function compareArray(arr1, arr2) {
      if (arr1.length !== arr2.length) {
        return false;
      }
      arr1.sort();
      arr2.sort();
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          return false;
        }
      }
      return true;
    }
    function testShuffle(arr) {
      const origin = arr.slice(0);
      expect(compareArray(origin, utils.shuffle(arr))).to.eql(true);
    }
    it("contains all items", () => {
      testShuffle([1]);
      testShuffle([1, 2]);
      testShuffle([2, 1]);
      testShuffle([1, 1, 1]);
      testShuffle([1, 2, 3]);
      testShuffle([3, -1, 0, 2, -1]);
      testShuffle(["a", "b", "d", "c"]);
      testShuffle(["c", "b"]);
    });

    it("mutates the original array", () => {
      const arr = [3, 7];
      const ret = utils.shuffle(arr);
      expect(arr === ret).to.eql(true);
    });

    it("shuffles the array", () => {
      const arr = [1, 2, 3, 4];
      const copy = arr.slice(0);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        utils.shuffle(copy);
        for (let i = 0; i < copy.length; i++) {
          if (arr[i] !== copy[i]) {
            return;
          }
        }
      }
    });
  });
});
