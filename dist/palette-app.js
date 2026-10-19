//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var S = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, T = Object.prototype.hasOwnProperty;
	function ee(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function te(e, t) {
		return ee(e.type, t, e.props);
	}
	function E(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function D(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ne = /\/+/g;
	function re(e, t) {
		return typeof e == "object" && e && e.key != null ? D("" + e.key) : t.toString(36);
	}
	function ie(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function ae(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, ae(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + re(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(ne, "$&/") + "/"), ae(o, r, i, "", function(e) {
			return e;
		})) : o != null && (E(o) && (o = te(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ne, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + re(a, u), c += ae(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + re(a, u++), c += ae(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ae(ie(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function oe(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ae(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function se(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var O = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, k = {
		map: oe,
		forEach: function(e, t, n) {
			oe(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return oe(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return oe(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!E(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = k, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !T.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return ee(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) T.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return ee(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = E, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: se
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = w.T, n = {};
		w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, O);
		} catch (e) {
			O(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.2.8";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, S || (S = !0, E());
			else {
				var t = n(l);
				t !== null && re(x, t.startTime - e);
			}
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function ee() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function te() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && ee());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && re(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
				}
			} finally {
				i ? E() : S = !1;
			}
		}
	}
	var E;
	if (typeof y == "function") E = function() {
		y(te);
	};
	else if (typeof MessageChannel < "u") {
		var D = new MessageChannel(), ne = D.port2;
		D.port1.onmessage = te, E = function() {
			ne.postMessage(null);
		};
	} else E = function() {
		_(te, 0);
	};
	function re(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, re(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, E()))), r;
	}, e.unstable_shouldYield = ee, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = c(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = c(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.8";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = f(), n = u(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), C = Symbol.for("react.context"), w = Symbol.for("react.forward_ref"), T = Symbol.for("react.suspense"), ee = Symbol.for("react.suspense_list"), te = Symbol.for("react.memo"), E = Symbol.for("react.lazy"), D = Symbol.for("react.activity"), ne = Symbol.for("react.memo_cache_sentinel"), re = Symbol.iterator;
	function ie(e) {
		return typeof e != "object" || !e ? null : (e = re && e[re] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var ae = Symbol.for("react.client.reference");
	function oe(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === ae ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case T: return "Suspense";
			case ee: return "SuspenseList";
			case D: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case C: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case w:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case te: return t = e.displayName || null, t === null ? oe(e.type) || "Memo" : t;
			case E:
				t = e._payload, e = e._init;
				try {
					return oe(e(t));
				} catch {}
		}
		return null;
	}
	var se = Array.isArray, O = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, k = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, A = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, ce = [], j = -1;
	function le(e) {
		return { current: e };
	}
	function M(e) {
		0 > j || (e.current = ce[j], ce[j] = null, j--);
	}
	function N(e, t) {
		j++, ce[j] = e.current, e.current = t;
	}
	var ue = le(null), de = le(null), fe = le(null), pe = le(null);
	function me(e, t) {
		switch (N(fe, t), N(de, e), N(ue, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		M(ue), N(ue, e);
	}
	function he() {
		M(ue), M(de), M(fe);
	}
	function ge(e) {
		e.memoizedState !== null && N(pe, e);
		var t = ue.current, n = Hd(t, e.type);
		t !== n && (N(de, e), N(ue, n));
	}
	function _e(e) {
		de.current === e && (M(ue), M(de)), pe.current === e && (M(pe), Qf._currentValue = A);
	}
	var ve, ye;
	function be(e) {
		if (ve === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			ve = t && t[1] || "", ye = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + ve + e + ye;
	}
	var xe = !1;
	function Se(e, t) {
		if (!e || xe) return "";
		xe = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			xe = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? be(n) : "";
	}
	function Ce(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return be(e.type);
			case 16: return be("Lazy");
			case 13: return e.child !== t && t !== null ? be("Suspense Fallback") : be("Suspense");
			case 19: return be("SuspenseList");
			case 0:
			case 15: return Se(e.type, !1);
			case 11: return Se(e.type.render, !1);
			case 1: return Se(e.type, !0);
			case 31: return be("Activity");
			default: return "";
		}
	}
	function we(e) {
		try {
			var t = "", n = null;
			do
				t += Ce(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Te = Object.prototype.hasOwnProperty, Ee = t.unstable_scheduleCallback, De = t.unstable_cancelCallback, Oe = t.unstable_shouldYield, ke = t.unstable_requestPaint, Ae = t.unstable_now, je = t.unstable_getCurrentPriorityLevel, Me = t.unstable_ImmediatePriority, Ne = t.unstable_UserBlockingPriority, Pe = t.unstable_NormalPriority, Fe = t.unstable_LowPriority, Ie = t.unstable_IdlePriority, Le = t.log, Re = t.unstable_setDisableYieldValue, ze = null, Be = null;
	function Ve(e) {
		if (typeof Le == "function" && Re(e), Be && typeof Be.setStrictMode == "function") try {
			Be.setStrictMode(ze, e);
		} catch {}
	}
	var He = Math.clz32 ? Math.clz32 : Ge, Ue = Math.log, We = Math.LN2;
	function Ge(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ue(e) / We | 0) | 0;
	}
	var Ke = 256, qe = 262144, Je = 4194304;
	function P(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function Ye(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = P(n))) : i = P(o) : i = P(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = P(n))) : i = P(o)) : i = P(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Xe(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Ze(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function Qe() {
		var e = Je;
		return Je <<= 1, !(Je & 62914560) && (Je = 4194304), e;
	}
	function $e(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function et(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function tt(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - He(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && nt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function nt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - He(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function rt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - He(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function F(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : it(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function it(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function at(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ot() {
		var e = k.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function st(e, t) {
		var n = k.p;
		try {
			return k.p = e, t();
		} finally {
			k.p = n;
		}
	}
	var ct = Math.random().toString(36).slice(2), lt = "__reactFiber$" + ct, ut = "__reactProps$" + ct, dt = "__reactContainer$" + ct, ft = "__reactEvents$" + ct, pt = "__reactListeners$" + ct, mt = "__reactHandles$" + ct, I = "__reactResources$" + ct, ht = "__reactMarker$" + ct;
	function gt(e) {
		delete e[lt], delete e[ut], delete e[ft], delete e[pt], delete e[mt];
	}
	function _t(e) {
		var t = e[lt];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[dt] || n[lt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[lt]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function vt(e) {
		if (e = e[lt] || e[dt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function yt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function bt(e) {
		var t = e[I];
		return t ||= e[I] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function xt(e) {
		e[ht] = !0;
	}
	var L = /* @__PURE__ */ new Set(), St = {};
	function Ct(e, t) {
		wt(e, t), wt(e + "Capture", t);
	}
	function wt(e, t) {
		for (St[e] = t, e = 0; e < t.length; e++) L.add(t[e]);
	}
	var Tt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Et = {}, Dt = {};
	function Ot(e) {
		return Te.call(Dt, e) ? !0 : Te.call(Et, e) ? !1 : Tt.test(e) ? Dt[e] = !0 : (Et[e] = !0, !1);
	}
	function kt(e, t, n) {
		if (Ot(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, "" + n);
			}
		}
	}
	function At(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function jt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function Mt(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function Nt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Pt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Ft(e) {
		if (!e._valueTracker) {
			var t = Nt(e) ? "checked" : "value";
			e._valueTracker = Pt(e, t, "" + e[t]);
		}
	}
	function It(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Nt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Lt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Rt = /[\n"\\]/g;
	function zt(e) {
		return e.replace(Rt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function R(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Mt(t)) : e.value !== "" + Mt(t) && (e.value = "" + Mt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : z(e, o, Mt(n)) : z(e, o, Mt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Mt(s) : e.removeAttribute("name");
	}
	function Bt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Ft(e);
				return;
			}
			n = n == null ? "" : "" + Mt(n), t = t == null ? n : "" + Mt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Ft(e);
	}
	function z(e, t, n) {
		t === "number" && Lt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Vt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Mt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Ht(e, t, n) {
		if (t != null && (t = "" + Mt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Mt(n);
	}
	function Ut(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (se(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Mt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Ft(e);
	}
	function Wt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Gt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Kt(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Gt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function qt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && Kt(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && Kt(e, o, t[o]);
	}
	function Jt(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Yt = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), Xt = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Zt(e) {
		return Xt.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function Qt() {}
	var $t = null;
	function en(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var tn = null, nn = null;
	function rn(e) {
		var t = vt(e);
		if (t && (e = t.stateNode)) {
			var n = e[ut] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (R(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + zt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[ut] || null;
								if (!a) throw Error(i(90));
								R(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && It(r);
					}
					break a;
				case "textarea":
					Ht(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Vt(e, !!n.multiple, t, !1);
			}
		}
	}
	var an = !1;
	function on(e, t, n) {
		if (an) return e(t, n);
		an = !0;
		try {
			return e(t);
		} finally {
			if (an = !1, (tn !== null || nn !== null) && (bu(), tn && (t = tn, e = nn, nn = tn = null, rn(t), e))) for (t = 0; t < e.length; t++) rn(e[t]);
		}
	}
	function sn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[ut] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var cn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ln = !1;
	if (cn) try {
		var un = {};
		Object.defineProperty(un, "passive", { get: function() {
			ln = !0;
		} }), window.addEventListener("test", un, un), window.removeEventListener("test", un, un);
	} catch {
		ln = !1;
	}
	var dn = null, fn = null, pn = null;
	function mn() {
		if (pn) return pn;
		var e, t = fn, n = t.length, r, i = "value" in dn ? dn.value : dn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return pn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function hn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function gn() {
		return !0;
	}
	function _n() {
		return !1;
	}
	function vn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? gn : _n, this.isPropagationStopped = _n, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = gn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = gn);
			},
			persist: function() {},
			isPersistent: gn
		}), t;
	}
	var yn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, bn = vn(yn), xn = h({}, yn, {
		view: 0,
		detail: 0
	}), Sn = vn(xn), Cn, wn, Tn, En = h({}, xn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Ln,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Tn && (Tn && e.type === "mousemove" ? (Cn = e.screenX - Tn.screenX, wn = e.screenY - Tn.screenY) : wn = Cn = 0, Tn = e), Cn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : wn;
		}
	}), Dn = vn(En), On = vn(h({}, En, { dataTransfer: 0 })), kn = vn(h({}, xn, { relatedTarget: 0 })), An = vn(h({}, yn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), jn = vn(h({}, yn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Mn = vn(h({}, yn, { data: 0 })), Nn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, Pn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Fn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function In(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Fn[e]) ? !!t[e] : !1;
	}
	function Ln() {
		return In;
	}
	var Rn = vn(h({}, xn, {
		key: function(e) {
			if (e.key) {
				var t = Nn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = hn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Pn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Ln,
		charCode: function(e) {
			return e.type === "keypress" ? hn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? hn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), zn = vn(h({}, En, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Bn = vn(h({}, xn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Ln
	})), Vn = vn(h({}, yn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Hn = vn(h({}, En, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Un = vn(h({}, yn, {
		newState: 0,
		oldState: 0
	})), Wn = [
		9,
		13,
		27,
		32
	], Gn = cn && "CompositionEvent" in window, Kn = null;
	cn && "documentMode" in document && (Kn = document.documentMode);
	var qn = cn && "TextEvent" in window && !Kn, Jn = cn && (!Gn || Kn && 8 < Kn && 11 >= Kn), Yn = " ", Xn = !1;
	function Zn(e, t) {
		switch (e) {
			case "keyup": return Wn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function Qn(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var $n = !1;
	function er(e, t) {
		switch (e) {
			case "compositionend": return Qn(t);
			case "keypress": return t.which === 32 ? (Xn = !0, Yn) : null;
			case "textInput": return e = t.data, e === Yn && Xn ? null : e;
			default: return null;
		}
	}
	function tr(e, t) {
		if ($n) return e === "compositionend" || !Gn && Zn(e, t) ? (e = mn(), pn = fn = dn = null, $n = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Jn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var nr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function rr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!nr[e.type] : t === "textarea";
	}
	function ir(e, t, n, r) {
		tn ? nn ? nn.push(r) : nn = [r] : tn = r, t = Ed(t, "onChange"), 0 < t.length && (n = new bn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var ar = null, or = null;
	function sr(e) {
		yd(e, 0);
	}
	function cr(e) {
		if (It(yt(e))) return e;
	}
	function lr(e, t) {
		if (e === "change") return t;
	}
	var ur = !1;
	if (cn) {
		var dr;
		if (cn) {
			var fr = "oninput" in document;
			if (!fr) {
				var pr = document.createElement("div");
				pr.setAttribute("oninput", "return;"), fr = typeof pr.oninput == "function";
			}
			dr = fr;
		} else dr = !1;
		ur = dr && (!document.documentMode || 9 < document.documentMode);
	}
	function mr() {
		ar && (ar.detachEvent("onpropertychange", hr), or = ar = null);
	}
	function hr(e) {
		if (e.propertyName === "value" && cr(or)) {
			var t = [];
			ir(t, or, e, en(e)), on(sr, t);
		}
	}
	function gr(e, t, n) {
		e === "focusin" ? (mr(), ar = t, or = n, ar.attachEvent("onpropertychange", hr)) : e === "focusout" && mr();
	}
	function _r(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return cr(or);
	}
	function vr(e, t) {
		if (e === "click") return cr(t);
	}
	function yr(e, t) {
		if (e === "input" || e === "change") return cr(t);
	}
	function br(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var xr = typeof Object.is == "function" ? Object.is : br;
	function Sr(e, t) {
		if (xr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Te.call(t, i) || !xr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Cr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function wr(e, t) {
		var n = Cr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Cr(n);
		}
	}
	function Tr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Tr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Er(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Lt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Lt(e.document);
		}
		return t;
	}
	function Dr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Or = cn && "documentMode" in document && 11 >= document.documentMode, kr = null, Ar = null, jr = null, Mr = !1;
	function Nr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Mr || kr == null || kr !== Lt(r) || (r = kr, "selectionStart" in r && Dr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), jr && Sr(jr, r) || (jr = r, r = Ed(Ar, "onSelect"), 0 < r.length && (t = new bn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = kr)));
	}
	function Pr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Fr = {
		animationend: Pr("Animation", "AnimationEnd"),
		animationiteration: Pr("Animation", "AnimationIteration"),
		animationstart: Pr("Animation", "AnimationStart"),
		transitionrun: Pr("Transition", "TransitionRun"),
		transitionstart: Pr("Transition", "TransitionStart"),
		transitioncancel: Pr("Transition", "TransitionCancel"),
		transitionend: Pr("Transition", "TransitionEnd")
	}, Ir = {}, Lr = {};
	cn && (Lr = document.createElement("div").style, "AnimationEvent" in window || (delete Fr.animationend.animation, delete Fr.animationiteration.animation, delete Fr.animationstart.animation), "TransitionEvent" in window || delete Fr.transitionend.transition);
	function Rr(e) {
		if (Ir[e]) return Ir[e];
		if (!Fr[e]) return e;
		var t = Fr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Lr) return Ir[e] = t[n];
		return e;
	}
	var zr = Rr("animationend"), Br = Rr("animationiteration"), Vr = Rr("animationstart"), Hr = Rr("transitionrun"), Ur = Rr("transitionstart"), Wr = Rr("transitioncancel"), Gr = Rr("transitionend"), Kr = /* @__PURE__ */ new Map(), qr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	qr.push("scrollEnd");
	function Jr(e, t) {
		Kr.set(e, t), Ct(t, [e]);
	}
	var Yr = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, Xr = [], Zr = 0, Qr = 0;
	function $r() {
		for (var e = Zr, t = Qr = Zr = 0; t < e;) {
			var n = Xr[t];
			Xr[t++] = null;
			var r = Xr[t];
			Xr[t++] = null;
			var i = Xr[t];
			Xr[t++] = null;
			var a = Xr[t];
			if (Xr[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ri(n, i, a);
		}
	}
	function ei(e, t, n, r) {
		Xr[Zr++] = e, Xr[Zr++] = t, Xr[Zr++] = n, Xr[Zr++] = r, Qr |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ti(e, t, n, r) {
		return ei(e, t, n, r), ii(e);
	}
	function ni(e, t) {
		return ei(e, null, null, t), ii(e);
	}
	function ri(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - He(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function ii(e) {
		if (50 < du) throw du = 0, fu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var ai = {};
	function oi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function si(e, t, n, r) {
		return new oi(e, t, n, r);
	}
	function ci(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function li(e, t) {
		var n = e.alternate;
		return n === null ? (n = si(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function ui(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function di(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") ci(e) && (s = 1);
		else if (typeof e == "string") s = Uf(e, n, ue.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case D: return e = si(31, n, t, a), e.elementType = D, e.lanes = o, e;
			case y: return fi(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = si(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case T: return e = si(13, n, t, a), e.elementType = T, e.lanes = o, e;
			case ee: return e = si(19, n, t, a), e.elementType = ee, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case C:
						s = 10;
						break a;
					case S:
						s = 9;
						break a;
					case w:
						s = 11;
						break a;
					case te:
						s = 14;
						break a;
					case E:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = si(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function fi(e, t, n, r) {
		return e = si(7, e, r, t), e.lanes = n, e;
	}
	function pi(e, t, n) {
		return e = si(6, e, null, t), e.lanes = n, e;
	}
	function mi(e) {
		var t = si(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function hi(e, t, n) {
		return t = si(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var gi = /* @__PURE__ */ new WeakMap();
	function _i(e, t) {
		if (typeof e == "object" && e) {
			var n = gi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: we(t)
			}, gi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: we(t)
		};
	}
	var vi = [], yi = 0, bi = null, xi = 0, Si = [], Ci = 0, wi = null, Ti = 1, Ei = "";
	function Di(e, t) {
		vi[yi++] = xi, vi[yi++] = bi, bi = e, xi = t;
	}
	function Oi(e, t, n) {
		Si[Ci++] = Ti, Si[Ci++] = Ei, Si[Ci++] = wi, wi = e;
		var r = Ti;
		e = Ei;
		var i = 32 - He(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - He(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Ti = 1 << 32 - He(t) + i | n << i | r, Ei = a + e;
		} else Ti = 1 << a | n << i | r, Ei = e;
	}
	function ki(e) {
		e.return !== null && (Di(e, 1), Oi(e, 1, 0));
	}
	function Ai(e) {
		for (; e === bi;) bi = vi[--yi], vi[yi] = null, xi = vi[--yi], vi[yi] = null;
		for (; e === wi;) wi = Si[--Ci], Si[Ci] = null, Ei = Si[--Ci], Si[Ci] = null, Ti = Si[--Ci], Si[Ci] = null;
	}
	function ji(e, t) {
		Si[Ci++] = Ti, Si[Ci++] = Ei, Si[Ci++] = wi, Ti = t.id, Ei = t.overflow, wi = e;
	}
	var Mi = null, B = null, V = !1, Ni = null, Pi = !1, Fi = Error(i(519));
	function Ii(e) {
		throw Hi(_i(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Fi;
	}
	function Li(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[lt] = e, t[ut] = r, n) {
			case "dialog":
				Q("cancel", t), Q("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Q("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < _d.length; n++) Q(_d[n], t);
				break;
			case "source":
				Q("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Q("error", t), Q("load", t);
				break;
			case "details":
				Q("toggle", t);
				break;
			case "input":
				Q("invalid", t), Bt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), Ut(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || Md(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = Qt), t = !0) : t = !1, t || Ii(e, !0);
	}
	function Ri(e) {
		for (Mi = e.return; Mi;) switch (Mi.tag) {
			case 5:
			case 31:
			case 13:
				Pi = !1;
				return;
			case 27:
			case 3:
				Pi = !0;
				return;
			default: Mi = Mi.return;
		}
	}
	function zi(e) {
		if (e !== Mi) return !1;
		if (!V) return Ri(e), V = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || Ud(e.type, e.memoizedProps)), n = !n), n && B && Ii(e), Ri(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			B = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			B = uf(e);
		} else t === 27 ? (t = B, Zd(e.type) ? (e = lf, lf = null, B = e) : B = t) : B = Mi ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Bi() {
		B = Mi = null, V = !1;
	}
	function Vi() {
		var e = Ni;
		return e !== null && ($l === null ? $l = e : $l.push.apply($l, e), Ni = null), e;
	}
	function Hi(e) {
		Ni === null ? Ni = [e] : Ni.push(e);
	}
	var Ui = le(null), Wi = null, Gi = null;
	function Ki(e, t, n) {
		N(Ui, t._currentValue), t._currentValue = n;
	}
	function qi(e) {
		e._currentValue = Ui.current, M(Ui);
	}
	function Ji(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Yi(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Ji(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Ji(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Xi(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					xr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === pe.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && Yi(t, e, n, r), t.flags |= 262144;
	}
	function Zi(e) {
		for (e = e.firstContext; e !== null;) {
			if (!xr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Qi(e) {
		Wi = e, Gi = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function $i(e) {
		return ta(Wi, e);
	}
	function ea(e, t) {
		return Wi === null && Qi(e), ta(e, t);
	}
	function ta(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Gi === null) {
			if (e === null) throw Error(i(308));
			Gi = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Gi = Gi.next = t;
		return n;
	}
	var na = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, ra = t.unstable_scheduleCallback, ia = t.unstable_NormalPriority, aa = {
		$$typeof: C,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function oa() {
		return {
			controller: new na(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function sa(e) {
		e.refCount--, e.refCount === 0 && ra(ia, function() {
			e.controller.abort();
		});
	}
	var ca = null, la = 0, ua = 0, da = null;
	function fa(e, t) {
		if (ca === null) {
			var n = ca = [];
			la = 0, ua = dd(), da = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return la++, t.then(pa, pa), t;
	}
	function pa() {
		if (--la === 0 && ca !== null) {
			da !== null && (da.status = "fulfilled");
			var e = ca;
			ca = null, ua = 0, da = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ma(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var ha = O.S;
	O.S = function(e, t) {
		nu = Ae(), typeof t == "object" && t && typeof t.then == "function" && fa(e, t), ha !== null && ha(e, t);
	};
	var ga = le(null);
	function _a() {
		var e = ga.current;
		return e === null ? Bl.pooledCache : e;
	}
	function va(e, t) {
		t === null ? N(ga, ga.current) : N(ga, t.pool);
	}
	function ya() {
		var e = _a();
		return e === null ? null : {
			parent: aa._currentValue,
			pool: e
		};
	}
	var ba = Error(i(460)), xa = Error(i(474)), Sa = Error(i(542)), Ca = { then: function() {} };
	function wa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ta(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Qt, Qt), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, ka(e), e;
			default:
				if (typeof t.status == "string") t.then(Qt, Qt);
				else {
					if (e = Bl, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, ka(e), e;
				}
				throw Da = t, ba;
		}
	}
	function Ea(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Da = e, ba) : e;
		}
	}
	var Da = null;
	function Oa() {
		if (Da === null) throw Error(i(459));
		var e = Da;
		return Da = null, e;
	}
	function ka(e) {
		if (e === ba || e === Sa) throw Error(i(483));
	}
	var Aa = null, ja = 0;
	function Ma(e) {
		var t = ja;
		return ja += 1, Aa === null && (Aa = []), Ta(Aa, e, t);
	}
	function Na(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Pa(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Fa(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = li(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = pi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === E && Ea(i) === t.type) ? (t = a(t, n.props), Na(t, n), t.return = e, t) : (t = di(n.type, n.key, n.props, null, e.mode, r), Na(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = hi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = fi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = pi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case _: return n = di(t.type, t.key, t.props, null, e.mode, n), Na(n, t), n.return = e, n;
					case v: return t = hi(t, e.mode, n), t.return = e, t;
					case E: return t = Ea(t), f(e, t, n);
				}
				if (se(t) || ie(t)) return t = fi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ma(t), n);
				if (t.$$typeof === C) return f(e, ea(e, t), n);
				Pa(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case _: return n.key === i ? l(e, t, n, r) : null;
					case v: return n.key === i ? u(e, t, n, r) : null;
					case E: return n = Ea(n), p(e, t, n, r);
				}
				if (se(n) || ie(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ma(n), r);
				if (n.$$typeof === C) return p(e, t, ea(e, n), r);
				Pa(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case E: return r = Ea(r), m(e, t, n, r, i);
				}
				if (se(r) || ie(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ma(r), i);
				if (r.$$typeof === C) return m(e, t, n, ea(t, r), i);
				Pa(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), V && Di(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return V && Di(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), V && Di(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), V && Di(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return V && Di(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), V && Di(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === y && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case _:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === y) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === E && Ea(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Na(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === y ? (c = fi(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = di(o.type, o.key, o.props, null, e.mode, c), Na(c, o), c.return = e, e = c);
						}
						return s(e);
					case v:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = hi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case E: return o = Ea(o), b(e, r, o, c);
				}
				if (se(o)) return h(e, r, o, c);
				if (ie(o)) {
					if (l = ie(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Ma(o), c);
				if (o.$$typeof === C) return b(e, r, ea(e, o), c);
				Pa(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = pi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				ja = 0;
				var i = b(e, t, n, r);
				return Aa = null, i;
			} catch (t) {
				if (t === ba || t === Sa) throw t;
				var a = si(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Ia = Fa(!0), La = Fa(!1), Ra = !1;
	function za(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function Ba(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Va(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ha(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, G & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ii(e), ri(e, null, n), t;
		}
		return ei(e, r, t, n), ii(e);
	}
	function Ua(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, rt(e, n);
		}
	}
	function Wa(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var Ga = !1;
	function Ka() {
		if (Ga) {
			var e = da;
			if (e !== null) throw e;
		}
	}
	function qa(e, t, n, r) {
		Ga = !1;
		var i = e.updateQueue;
		Ra = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (q & f) === f : (r & f) === f) {
					f !== 0 && f === ua && (Ga = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (m = g.payload, typeof m == "function") {
									d = m.call(_, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = g.payload, f = typeof m == "function" ? m.call(_, d, f) : m, f == null) break a;
								d = h({}, d, f);
								break a;
							case 2: Ra = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), ql |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ja(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Ya(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ja(n[e], t);
	}
	var Xa = le(null), Za = le(0);
	function Qa(e, t) {
		e = Gl, N(Za, e), N(Xa, t), Gl = e | t.baseLanes;
	}
	function $a() {
		N(Za, Gl), N(Xa, Xa.current);
	}
	function eo() {
		Gl = Za.current, M(Xa), M(Za);
	}
	var to = le(null), no = null;
	function ro(e) {
		var t = e.alternate;
		N(co, co.current & 1), N(to, e), no === null && (t === null || Xa.current !== null || t.memoizedState !== null) && (no = e);
	}
	function io(e) {
		N(co, co.current), N(to, e), no === null && (no = e);
	}
	function ao(e) {
		e.tag === 22 ? (N(co, co.current), N(to, e), no === null && (no = e)) : oo(e);
	}
	function oo() {
		N(co, co.current), N(to, to.current);
	}
	function so(e) {
		M(to), no === e && (no = null), M(co);
	}
	var co = le(0);
	function lo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || af(n) || of(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var uo = 0, H = null, U = null, fo = null, po = !1, mo = !1, ho = !1, go = 0, _o = 0, vo = null, yo = 0;
	function bo() {
		throw Error(i(321));
	}
	function xo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!xr(e[n], t[n])) return !1;
		return !0;
	}
	function So(e, t, n, r, i, a) {
		return uo = a, H = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, O.H = e === null || e.memoizedState === null ? zs : Bs, ho = !1, a = n(r, i), ho = !1, mo && (a = wo(t, n, r, i)), Co(e), a;
	}
	function Co(e) {
		O.H = Rs;
		var t = U !== null && U.next !== null;
		if (uo = 0, fo = U = H = null, po = !1, _o = 0, vo = null, t) throw Error(i(300));
		e === null || rc || (e = e.dependencies, e !== null && Zi(e) && (rc = !0));
	}
	function wo(e, t, n, r) {
		H = e;
		var a = 0;
		do {
			if (mo && (vo = null), _o = 0, mo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, fo = U = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			O.H = Vs, o = t(n, r);
		} while (mo);
		return o;
	}
	function To() {
		var e = O.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Mo(t) : t, e = e.useState()[0], (U === null ? null : U.memoizedState) !== e && (H.flags |= 1024), t;
	}
	function Eo() {
		var e = go !== 0;
		return go = 0, e;
	}
	function Do(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Oo(e) {
		if (po) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			po = !1;
		}
		uo = 0, fo = U = H = null, mo = !1, _o = go = 0, vo = null;
	}
	function ko() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return fo === null ? H.memoizedState = fo = e : fo = fo.next = e, fo;
	}
	function Ao() {
		if (U === null) {
			var e = H.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = U.next;
		var t = fo === null ? H.memoizedState : fo.next;
		if (t !== null) fo = t, U = e;
		else {
			if (e === null) throw H.alternate === null ? Error(i(467)) : Error(i(310));
			U = e, e = {
				memoizedState: U.memoizedState,
				baseState: U.baseState,
				baseQueue: U.baseQueue,
				queue: U.queue,
				next: null
			}, fo === null ? H.memoizedState = fo = e : fo = fo.next = e;
		}
		return fo;
	}
	function jo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Mo(e) {
		var t = _o;
		return _o += 1, vo === null && (vo = []), e = Ta(vo, e, t), t = H, (fo === null ? t.memoizedState : fo.next) === null && (t = t.alternate, O.H = t === null || t.memoizedState === null ? zs : Bs), e;
	}
	function No(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Mo(e);
			if (e.$$typeof === C) return $i(e);
		}
		throw Error(i(438, String(e)));
	}
	function Po(e) {
		var t = null, n = H.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = H.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = jo(), H.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ne;
		return t.index++, n;
	}
	function Fo(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Io(e) {
		return Lo(Ao(), U, e);
	}
	function Lo(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (uo & f) === f : (q & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ua && (d = !0);
					else if ((uo & p) === p) {
						u = u.next, p === ua && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, H.lanes |= p, ql |= p;
					f = u.action, ho && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, H.lanes |= f, ql |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !xr(o, e.memoizedState) && (rc = !0, d && (n = da, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Ro(e) {
		var t = Ao(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			xr(o, t.memoizedState) || (rc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function zo(e, t, n) {
		var r = H, a = Ao(), o = V;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !xr((U || a).memoizedState, n);
		if (s && (a.memoizedState = n, rc = !0), a = a.queue, us(Ho.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || fo !== null && fo.memoizedState.tag & 1) {
			if (r.flags |= 2048, as(9, { destroy: void 0 }, Vo.bind(null, r, a, n, t), null), Bl === null) throw Error(i(349));
			o || uo & 127 || Bo(r, t, n);
		}
		return n;
	}
	function Bo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = H.updateQueue, t === null ? (t = jo(), H.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Vo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Uo(t) && Wo(e);
	}
	function Ho(e, t, n) {
		return n(function() {
			Uo(t) && Wo(e);
		});
	}
	function Uo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !xr(e, n);
		} catch {
			return !0;
		}
	}
	function Wo(e) {
		var t = ni(e, 2);
		t !== null && hu(t, e, 2);
	}
	function Go(e) {
		var t = ko();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), ho) {
				Ve(!0);
				try {
					n();
				} finally {
					Ve(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Fo,
			lastRenderedState: e
		}, t;
	}
	function Ko(e, t, n, r) {
		return e.baseState = n, Lo(e, U, typeof r == "function" ? r : Fo);
	}
	function qo(e, t, n, r, a) {
		if (Fs(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			O.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Jo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Jo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = O.T, o = {};
			O.T = o;
			try {
				var s = n(i, r), c = O.S;
				c !== null && c(o, s), Yo(e, t, s);
			} catch (n) {
				Zo(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), O.T = a;
			}
		} else try {
			a = n(i, r), Yo(e, t, a);
		} catch (n) {
			Zo(e, t, n);
		}
	}
	function Yo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Xo(e, t, n);
		}, function(n) {
			return Zo(e, t, n);
		}) : Xo(e, t, n);
	}
	function Xo(e, t, n) {
		t.status = "fulfilled", t.value = n, Qo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Jo(e, n)));
	}
	function Zo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Qo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Qo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function $o(e, t) {
		return t;
	}
	function es(e, t) {
		if (V) {
			var n = Bl.formState;
			if (n !== null) {
				a: {
					var r = H;
					if (V) {
						if (B) {
							b: {
								for (var i = B, a = Pi; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = cf(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								B = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Ii(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = ko(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: $o,
			lastRenderedState: t
		}, n.queue = r, n = Ms.bind(null, H, r), r.dispatch = n, r = Go(!1), a = Ps.bind(null, H, !1, r.queue), r = ko(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = qo.bind(null, H, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function ts(e) {
		return ns(Ao(), U, e);
	}
	function ns(e, t, n) {
		if (t = Lo(e, t, $o)[0], e = Io(Fo)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Mo(t);
		} catch (e) {
			throw e === ba ? Sa : e;
		}
		else r = t;
		t = Ao();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (H.flags |= 2048, as(9, { destroy: void 0 }, rs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function rs(e, t) {
		e.action = t;
	}
	function is(e) {
		var t = Ao(), n = U;
		if (n !== null) return ns(t, n, e);
		Ao(), t = t.memoizedState, n = Ao();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function as(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = H.updateQueue, t === null && (t = jo(), H.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function os() {
		return Ao().memoizedState;
	}
	function ss(e, t, n, r) {
		var i = ko();
		H.flags |= e, i.memoizedState = as(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function cs(e, t, n, r) {
		var i = Ao();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		U !== null && r !== null && xo(r, U.memoizedState.deps) ? i.memoizedState = as(t, a, n, r) : (H.flags |= e, i.memoizedState = as(1 | t, a, n, r));
	}
	function ls(e, t) {
		ss(8390656, 8, e, t);
	}
	function us(e, t) {
		cs(2048, 8, e, t);
	}
	function ds(e) {
		H.flags |= 4;
		var t = H.updateQueue;
		if (t === null) t = jo(), H.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function fs(e) {
		var t = Ao().memoizedState;
		return ds({
			ref: t,
			nextImpl: e
		}), function() {
			if (G & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function ps(e, t) {
		return cs(4, 2, e, t);
	}
	function ms(e, t) {
		return cs(4, 4, e, t);
	}
	function hs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function gs(e, t, n) {
		n = n == null ? null : n.concat([e]), cs(4, 4, hs.bind(null, t, e), n);
	}
	function _s() {}
	function vs(e, t) {
		var n = Ao();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && xo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ys(e, t) {
		var n = Ao();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && xo(t, r[1])) return r[0];
		if (r = e(), ho) {
			Ve(!0);
			try {
				e();
			} finally {
				Ve(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function bs(e, t, n) {
		return n === void 0 || uo & 1073741824 && !(q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = mu(), H.lanes |= e, ql |= e, n);
	}
	function xs(e, t, n, r) {
		return xr(n, t) ? n : Xa.current === null ? !(uo & 42) || uo & 1073741824 && !(q & 261930) ? (rc = !0, e.memoizedState = n) : (e = mu(), H.lanes |= e, ql |= e, t) : (e = bs(e, n, r), xr(e, t) || (rc = !0), e);
	}
	function Ss(e, t, n, r, i) {
		var a = k.p;
		k.p = a !== 0 && 8 > a ? a : 8;
		var o = O.T, s = {};
		O.T = s, Ps(e, !1, t, n);
		try {
			var c = i(), l = O.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Ns(e, t, ma(c, r), pu(e)) : Ns(e, t, r, pu(e));
		} catch (n) {
			Ns(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, pu());
		} finally {
			k.p = a, o !== null && s.types !== null && (o.types = s.types), O.T = o;
		}
	}
	function Cs() {}
	function ws(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Ts(e).queue;
		Ss(e, a, t, A, n === null ? Cs : function() {
			return Es(e), n(r);
		});
	}
	function Ts(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: A,
			baseState: A,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Fo,
				lastRenderedState: A
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Fo,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Es(e) {
		var t = Ts(e);
		t.next === null && (t = e.alternate.memoizedState), Ns(e, t.next.queue, {}, pu());
	}
	function Ds() {
		return $i(Qf);
	}
	function Os() {
		return Ao().memoizedState;
	}
	function ks() {
		return Ao().memoizedState;
	}
	function As(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = pu();
					e = Va(n);
					var r = Ha(t, e, n);
					r !== null && (hu(r, t, n), Ua(r, t, n)), t = { cache: oa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function js(e, t, n) {
		var r = pu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Fs(e) ? Is(t, n) : (n = ti(e, t, n, r), n !== null && (hu(n, e, r), Ls(n, t, r)));
	}
	function Ms(e, t, n) {
		Ns(e, t, n, pu());
	}
	function Ns(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (Fs(e)) Is(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, xr(s, o)) return ei(e, t, i, 0), Bl === null && $r(), !1;
			} catch {}
			if (n = ti(e, t, i, r), n !== null) return hu(n, e, r), Ls(n, t, r), !0;
		}
		return !1;
	}
	function Ps(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: dd(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Fs(e)) {
			if (t) throw Error(i(479));
		} else t = ti(e, n, r, 2), t !== null && hu(t, e, 2);
	}
	function Fs(e) {
		var t = e.alternate;
		return e === H || t !== null && t === H;
	}
	function Is(e, t) {
		mo = po = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Ls(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, rt(e, n);
		}
	}
	var Rs = {
		readContext: $i,
		use: No,
		useCallback: bo,
		useContext: bo,
		useEffect: bo,
		useImperativeHandle: bo,
		useLayoutEffect: bo,
		useInsertionEffect: bo,
		useMemo: bo,
		useReducer: bo,
		useRef: bo,
		useState: bo,
		useDebugValue: bo,
		useDeferredValue: bo,
		useTransition: bo,
		useSyncExternalStore: bo,
		useId: bo,
		useHostTransitionStatus: bo,
		useFormState: bo,
		useActionState: bo,
		useOptimistic: bo,
		useMemoCache: bo,
		useCacheRefresh: bo
	};
	Rs.useEffectEvent = bo;
	var zs = {
		readContext: $i,
		use: No,
		useCallback: function(e, t) {
			return ko().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: $i,
		useEffect: ls,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), ss(4194308, 4, hs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return ss(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			ss(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = ko();
			t = t === void 0 ? null : t;
			var r = e();
			if (ho) {
				Ve(!0);
				try {
					e();
				} finally {
					Ve(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = ko();
			if (n !== void 0) {
				var i = n(t);
				if (ho) {
					Ve(!0);
					try {
						n(t);
					} finally {
						Ve(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = js.bind(null, H, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = ko();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Go(e);
			var t = e.queue, n = Ms.bind(null, H, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			return bs(ko(), e, t);
		},
		useTransition: function() {
			var e = Go(!1);
			return e = Ss.bind(null, H, e.queue, !0, !1), ko().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = H, a = ko();
			if (V) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), Bl === null) throw Error(i(349));
				q & 127 || Bo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ls(Ho.bind(null, r, o, e), [e]), r.flags |= 2048, as(9, { destroy: void 0 }, Vo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = ko(), t = Bl.identifierPrefix;
			if (V) {
				var n = Ei, r = Ti;
				n = (r & ~(1 << 32 - He(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = go++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = yo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Ds,
		useFormState: es,
		useActionState: es,
		useOptimistic: function(e) {
			var t = ko();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = Ps.bind(null, H, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Po,
		useCacheRefresh: function() {
			return ko().memoizedState = As.bind(null, H);
		},
		useEffectEvent: function(e) {
			var t = ko(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (G & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Bs = {
		readContext: $i,
		use: No,
		useCallback: vs,
		useContext: $i,
		useEffect: us,
		useImperativeHandle: gs,
		useInsertionEffect: ps,
		useLayoutEffect: ms,
		useMemo: ys,
		useReducer: Io,
		useRef: os,
		useState: function() {
			return Io(Fo);
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			return xs(Ao(), U.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Io(Fo)[0], t = Ao().memoizedState;
			return [typeof e == "boolean" ? e : Mo(e), t];
		},
		useSyncExternalStore: zo,
		useId: Os,
		useHostTransitionStatus: Ds,
		useFormState: ts,
		useActionState: ts,
		useOptimistic: function(e, t) {
			return Ko(Ao(), U, e, t);
		},
		useMemoCache: Po,
		useCacheRefresh: ks
	};
	Bs.useEffectEvent = fs;
	var Vs = {
		readContext: $i,
		use: No,
		useCallback: vs,
		useContext: $i,
		useEffect: us,
		useImperativeHandle: gs,
		useInsertionEffect: ps,
		useLayoutEffect: ms,
		useMemo: ys,
		useReducer: Ro,
		useRef: os,
		useState: function() {
			return Ro(Fo);
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			var n = Ao();
			return U === null ? bs(n, e, t) : xs(n, U.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Ro(Fo)[0], t = Ao().memoizedState;
			return [typeof e == "boolean" ? e : Mo(e), t];
		},
		useSyncExternalStore: zo,
		useId: Os,
		useHostTransitionStatus: Ds,
		useFormState: is,
		useActionState: is,
		useOptimistic: function(e, t) {
			var n = Ao();
			return U === null ? (n.baseState = e, [e, n.queue.dispatch]) : Ko(n, U, e, t);
		},
		useMemoCache: Po,
		useCacheRefresh: ks
	};
	Vs.useEffectEvent = fs;
	function Hs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Us = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Va(r);
			i.payload = t, n != null && (i.callback = n), t = Ha(e, i, r), t !== null && (hu(t, e, r), Ua(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Va(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ha(e, i, r), t !== null && (hu(t, e, r), Ua(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = pu(), r = Va(n);
			r.tag = 2, t != null && (r.callback = t), t = Ha(e, r, n), t !== null && (hu(t, e, n), Ua(t, e, n));
		}
	};
	function Ws(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Sr(n, r) || !Sr(i, a) : !0;
	}
	function Gs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Us.enqueueReplaceState(t, t.state, null);
	}
	function Ks(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function qs(e) {
		Yr(e);
	}
	function Js(e) {
		console.error(e);
	}
	function Ys(e) {
		Yr(e);
	}
	function Xs(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Zs(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Qs(e, t, n) {
		return n = Va(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Xs(e, t);
		}, n;
	}
	function $s(e) {
		return e = Va(e), e.tag = 3, e;
	}
	function ec(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Zs(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Zs(t, n, r), typeof i != "function" && (au === null ? au = /* @__PURE__ */ new Set([this]) : au.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function tc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Xi(t, n, a, !0), n = to.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return no === null ? Du() : n.alternate === null && Kl === 0 && (Kl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Ca ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Gu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === Ca ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Gu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Gu(e, r, a), Du(), !1;
		}
		if (V) return t = to.current, t === null ? (r !== Fi && (t = Error(i(423), { cause: r }), Hi(_i(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = _i(r, n), a = Qs(e.stateNode, r, a), Wa(e, a), Kl !== 4 && (Kl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Fi && (e = Error(i(422), { cause: r }), Hi(_i(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = _i(o, n), Ql === null ? Ql = [o] : Ql.push(o), Kl !== 4 && (Kl = 2), t === null) return !0;
		r = _i(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Qs(n.stateNode, r, e), Wa(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (au === null || !au.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = $s(a), ec(a, e, n, r), Wa(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var nc = Error(i(461)), rc = !1;
	function ic(e, t, n, r) {
		t.child = e === null ? La(t, null, n, r) : Ia(t, e.child, n, r);
	}
	function ac(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Qi(t), r = So(e, t, n, o, a, i), s = Eo(), e !== null && !rc ? (Do(e, t, i), kc(e, t, i)) : (V && s && ki(t), t.flags |= 1, ic(e, t, r, i), t.child);
	}
	function oc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ci(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, sc(e, t, a, r, i)) : (e = di(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Ac(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Sr : n, n(o, r) && e.ref === t.ref) return kc(e, t, i);
		}
		return t.flags |= 1, e = li(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function sc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Sr(a, r) && e.ref === t.ref) {
				if (rc = !1, t.pendingProps = r = a, Ac(e, i)) e.flags & 131072 && (rc = !0);
				else return t.lanes = e.lanes, kc(e, t, i);
			}
		}
		return hc(e, t, n, r, i);
	}
	function cc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return uc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && va(t, a === null ? null : a.cachePool), a === null ? $a() : Qa(t, a), ao(t);
			else return r = t.lanes = 536870912, uc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && va(t, null), $a(), oo(t)) : (va(t, a.cachePool), Qa(t, a), oo(t), t.memoizedState = null);
		return ic(e, t, i, n), t.child;
	}
	function lc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function uc(e, t, n, r, i) {
		var a = _a();
		return a = a === null ? null : {
			parent: aa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && va(t, null), $a(), ao(t), e !== null && Xi(e, t, r, !0), t.childLanes = i, null;
	}
	function dc(e, t) {
		return t = wc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function fc(e, t, n) {
		return Ia(t, e.child, null, n), e = dc(t, t.pendingProps), e.flags |= 2, so(t), t.memoizedState = null, e;
	}
	function pc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (V) {
				if (r.mode === "hidden") return e = dc(t, r), t.lanes = 536870912, lc(null, e);
				if (io(t), (e = B) ? (e = rf(e, Pi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: wi === null ? null : {
						id: Ti,
						overflow: Ei
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = mi(e), n.return = t, t.child = n, Mi = t, B = null)) : e = null, e === null) throw Ii(t);
				return t.lanes = 536870912, null;
			}
			return dc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (io(t), a) {
				if (t.flags & 256) t.flags &= -257, t = fc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (rc || Xi(e, t, n, !1), a = (n & e.childLanes) !== 0, rc || a) {
				if (r = Bl, r !== null && (s = F(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, ni(e, s), hu(r, e, s), nc;
				Du(), t = fc(e, t, n);
			} else e = o.treeContext, B = cf(s.nextSibling), Mi = t, V = !0, Ni = null, Pi = !1, e !== null && ji(t, e), t = dc(t, r), t.flags |= 4096;
			return t;
		}
		return e = li(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function mc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function hc(e, t, n, r, i) {
		return Qi(t), n = So(e, t, n, r, void 0, i), r = Eo(), e !== null && !rc ? (Do(e, t, i), kc(e, t, i)) : (V && r && ki(t), t.flags |= 1, ic(e, t, n, i), t.child);
	}
	function gc(e, t, n, r, i, a) {
		return Qi(t), t.updateQueue = null, n = wo(t, r, n, i), Co(e), r = Eo(), e !== null && !rc ? (Do(e, t, a), kc(e, t, a)) : (V && r && ki(t), t.flags |= 1, ic(e, t, n, a), t.child);
	}
	function _c(e, t, n, r, i) {
		if (Qi(t), t.stateNode === null) {
			var a = ai, o = n.contextType;
			typeof o == "object" && o && (a = $i(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Us, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, za(t), o = n.contextType, a.context = typeof o == "object" && o ? $i(o) : ai, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Hs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Us.enqueueReplaceState(a, a.state, null), qa(t, r, a, i), Ka(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Ks(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = ai, typeof u == "object" && u && (o = $i(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Gs(t, a, r, o), Ra = !1;
			var f = t.memoizedState;
			a.state = f, qa(t, r, a, i), Ka(), l = t.memoizedState, s || f !== l || Ra ? (typeof d == "function" && (Hs(t, n, d, r), l = t.memoizedState), (c = Ra || Ws(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Ba(e, t), o = t.memoizedProps, u = Ks(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = ai, typeof l == "object" && l && (c = $i(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Gs(t, a, r, c), Ra = !1, f = t.memoizedState, a.state = f, qa(t, r, a, i), Ka();
			var p = t.memoizedState;
			o !== d || f !== p || Ra || e !== null && e.dependencies !== null && Zi(e.dependencies) ? (typeof s == "function" && (Hs(t, n, s, r), p = t.memoizedState), (u = Ra || Ws(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Zi(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, mc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Ia(t, e.child, null, i), t.child = Ia(t, null, n, i)) : ic(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = kc(e, t, i), e;
	}
	function vc(e, t, n, r) {
		return Bi(), t.flags |= 256, ic(e, t, n, r), t.child;
	}
	var yc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function bc(e) {
		return {
			baseLanes: e,
			cachePool: ya()
		};
	}
	function xc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Xl), e;
	}
	function Sc(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(co.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (V) {
				if (a ? ro(t) : oo(t), (e = B) ? (e = rf(e, Pi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: wi === null ? null : {
						id: Ti,
						overflow: Ei
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = mi(e), n.return = t, t.child = n, Mi = t, B = null)) : e = null, e === null) throw Ii(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (oo(t), a = t.mode, c = wc({
				mode: "hidden",
				children: c
			}, a), r = fi(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = bc(n), r.childLanes = xc(e, s, n), t.memoizedState = yc, lc(null, r)) : (ro(t), Cc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (ro(t), t.flags &= -257, t = Tc(e, t, n)) : t.memoizedState === null ? (oo(t), c = r.fallback, a = t.mode, r = wc({
				mode: "visible",
				children: r.children
			}, a), c = fi(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Ia(t, e.child, null, n), r = t.child, r.memoizedState = bc(n), r.childLanes = xc(e, s, n), t.memoizedState = yc, t = lc(null, r)) : (oo(t), t.child = e.child, t.flags |= 128, t = null);
			else if (ro(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Hi({
					value: r,
					source: null,
					stack: null
				}), t = Tc(e, t, n);
			} else if (rc || Xi(e, t, n, !1), s = (n & e.childLanes) !== 0, rc || s) {
				if (s = Bl, s !== null && (r = F(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, ni(e, r), hu(s, e, r), nc;
				af(c) || Du(), t = Tc(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, B = cf(c.nextSibling), Mi = t, V = !0, Ni = null, Pi = !1, e !== null && ji(t, e), t = Cc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (oo(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = li(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = fi(c, a, n, null), c.flags |= 2) : c = li(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, lc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = bc(n) : (a = c.cachePool, a === null ? a = ya() : (l = aa._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = xc(e, s, n), t.memoizedState = yc, lc(e.child, r)) : (ro(t), n = e.child, e = n.sibling, n = li(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Cc(e, t) {
		return t = wc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function wc(e, t) {
		return e = si(22, e, null, t), e.lanes = 0, e;
	}
	function Tc(e, t, n) {
		return Ia(t, e.child, null, n), e = Cc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Ec(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ji(e.return, t, n);
	}
	function Dc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Oc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = co.current, s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, N(co, o), ic(e, t, r, n), r = V ? xi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Ec(e, n, t);
			else if (e.tag === 19) Ec(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && lo(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Dc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && lo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Dc(t, !0, n, null, a, r);
				break;
			case "together":
				Dc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function kc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), ql |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Xi(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = li(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = li(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Ac(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Zi(e)));
	}
	function jc(e, t, n) {
		switch (t.tag) {
			case 3:
				me(t, t.stateNode.containerInfo), Ki(t, aa, e.memoizedState.cache), Bi();
				break;
			case 27:
			case 5:
				ge(t);
				break;
			case 4:
				me(t, t.stateNode.containerInfo);
				break;
			case 10:
				Ki(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, io(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (ro(t), e = kc(e, t, n), e === null ? null : e.sibling) : Sc(e, t, n) : (ro(t), t.flags |= 128, null);
				ro(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= (Xi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return Oc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), N(co, co.current), r) break;
				return null;
			case 22: return t.lanes = 0, cc(e, t, n, t.pendingProps);
			case 24: Ki(t, aa, e.memoizedState.cache);
		}
		return kc(e, t, n);
	}
	function Mc(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) rc = !0;
			else {
				if (!Ac(e, n) && !(t.flags & 128)) return rc = !1, jc(e, t, n);
				rc = !!(e.flags & 131072);
			}
		} else rc = !1, V && t.flags & 1048576 && Oi(t, xi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ea(t.elementType), t.type = e, typeof e == "function") ci(e) ? (r = Ks(e, r), t.tag = 1, t = _c(null, t, e, r, n)) : (t.tag = 0, t = hc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === w) {
								t.tag = 11, t = ac(null, t, e, r, n);
								break a;
							}
							if (a === te) {
								t.tag = 14, t = oc(null, t, e, r, n);
								break a;
							}
						}
						throw t = oe(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return hc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Ks(r, t.pendingProps), _c(e, t, r, a, n);
			case 3:
				a: {
					if (me(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Ba(e, t), qa(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Ki(t, aa, r), r !== o.cache && Yi(t, [aa], n, !0), Ka(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = vc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = _i(Error(i(424)), t), Hi(a), t = vc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (B = cf(e.firstChild), Mi = t, V = !0, Ni = null, Pi = !0, n = La(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Bi(), r === a) {
							t = kc(e, t, n);
							break a;
						}
						ic(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return mc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : V || (n = t.type, e = t.pendingProps, r = Bd(fe.current).createElement(n), r[lt] = t, r[ut] = e, Pd(r, n, e), xt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ge(t), e === null && V && (r = t.stateNode = ff(t.type, t.pendingProps, fe.current), Mi = t, Pi = !0, a = B, Zd(t.type) ? (lf = a, B = cf(r.firstChild)) : B = a), ic(e, t, t.pendingProps.children, n), mc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && V && ((a = r = B) && (r = tf(r, t.type, t.pendingProps, Pi), r === null ? a = !1 : (t.stateNode = r, Mi = t, B = cf(r.firstChild), Pi = !1, a = !0)), a || Ii(t)), ge(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = So(e, t, To, null, null, n), Qf._currentValue = a), mc(e, t), ic(e, t, r, n), t.child;
			case 6: return e === null && V && ((e = n = B) && (n = nf(n, t.pendingProps, Pi), n === null ? e = !1 : (t.stateNode = n, Mi = t, B = null, e = !0)), e || Ii(t)), null;
			case 13: return Sc(e, t, n);
			case 4: return me(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Ia(t, null, r, n) : ic(e, t, r, n), t.child;
			case 11: return ac(e, t, t.type, t.pendingProps, n);
			case 7: return ic(e, t, t.pendingProps, n), t.child;
			case 8: return ic(e, t, t.pendingProps.children, n), t.child;
			case 12: return ic(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Ki(t, t.type, r.value), ic(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, Qi(t), a = $i(a), r = r(a), t.flags |= 1, ic(e, t, r, n), t.child;
			case 14: return oc(e, t, t.type, t.pendingProps, n);
			case 15: return sc(e, t, t.type, t.pendingProps, n);
			case 19: return Oc(e, t, n);
			case 31: return pc(e, t, n);
			case 22: return cc(e, t, n, t.pendingProps);
			case 24: return Qi(t), r = $i(aa), e === null ? (a = _a(), a === null && (a = Bl, o = oa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, za(t), Ki(t, aa, a)) : ((e.lanes & n) !== 0 && (Ba(e, t), qa(t, null, null, n), Ka()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Ki(t, aa, r), r !== a.cache && Yi(t, [aa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Ki(t, aa, r))), ic(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Nc(e) {
		e.flags |= 4;
	}
	function Pc(e, t, n, r, i) {
		if ((t = !!(e.mode & 32)) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (wu()) e.flags |= 8192;
				else throw Da = Ca, xa;
			}
		} else e.flags &= -16777217;
	}
	function Fc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) {
			if (wu()) e.flags |= 8192;
			else throw Da = Ca, xa;
		}
	}
	function Ic(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : Qe(), e.lanes |= t, Zl |= t);
	}
	function Lc(e, t) {
		if (!V) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function Rc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function zc(e, t, n) {
		var r = t.pendingProps;
		switch (Ai(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Rc(t), null;
			case 1: return Rc(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), qi(aa), he(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (zi(t) ? Nc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Vi())), Rc(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Nc(t), o === null ? (Rc(t), Pc(t, a, null, r, n)) : (Rc(t), Fc(t, o))) : o ? o === e.memoizedState ? (Rc(t), t.flags &= -16777217) : (Nc(t), Rc(t), Fc(t, o)) : (e = e.memoizedProps, e !== r && Nc(t), Rc(t), Pc(t, a, e, r, n)), null;
			case 27:
				if (_e(t), n = fe.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Rc(t), null;
					}
					e = ue.current, zi(t) ? Li(t, e) : (e = ff(a, r, n), t.stateNode = e, Nc(t));
				}
				return Rc(t), null;
			case 5:
				if (_e(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Rc(t), null;
					}
					if (o = ue.current, zi(t)) Li(t, o);
					else {
						var s = Bd(fe.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[lt] = t, o[ut] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (Pd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && Nc(t);
					}
				}
				return Rc(t), Pc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = fe.current, zi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Mi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[lt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Md(e.nodeValue, n)), e || Ii(t, !0);
					} else e = Bd(e).createTextNode(r), e[lt] = t, t.stateNode = e;
				}
				return Rc(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = zi(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[lt] = t;
						} else Bi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Rc(t), e = !1;
					} else n = Vi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (so(t), t) : (so(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Rc(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = zi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[lt] = t;
						} else Bi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Rc(t), a = !1;
					} else a = Vi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (so(t), t) : (so(t), null);
				}
				return so(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Ic(t, t.updateQueue), Rc(t), null);
			case 4: return he(), e === null && Sd(t.stateNode.containerInfo), Rc(t), null;
			case 10: return qi(t.type), Rc(t), null;
			case 19:
				if (M(co), r = t.memoizedState, r === null) return Rc(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) Lc(r, !1);
					else {
						if (Kl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = lo(e), o !== null) {
								for (t.flags |= 128, Lc(r, !1), e = o.updateQueue, t.updateQueue = e, Ic(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) ui(n, e), n = n.sibling;
								return N(co, co.current & 1 | 2), V && Di(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && Ae() > ru && (t.flags |= 128, a = !0, Lc(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = lo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Ic(t, e), Lc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !V) return Rc(t), null;
						} else 2 * Ae() - r.renderingStartTime > ru && n !== 536870912 && (t.flags |= 128, a = !0, Lc(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (Rc(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Ae(), e.sibling = null, n = co.current, N(co, a ? n & 1 | 2 : n & 1), V && Di(t, r.treeForkCount), e);
			case 22:
			case 23: return so(t), eo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Rc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Rc(t), n = t.updateQueue, n !== null && Ic(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && M(ga), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), qi(aa), Rc(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Bc(e, t) {
		switch (Ai(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return qi(aa), he(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return _e(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (so(t), t.alternate === null) throw Error(i(340));
					Bi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (so(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Bi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return M(co), null;
			case 4: return he(), null;
			case 10: return qi(t.type), null;
			case 22:
			case 23: return so(t), eo(), e !== null && M(ga), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return qi(aa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Vc(e, t) {
		switch (Ai(t), t.tag) {
			case 3:
				qi(aa), he();
				break;
			case 26:
			case 27:
			case 5:
				_e(t);
				break;
			case 4:
				he();
				break;
			case 31:
				t.memoizedState !== null && so(t);
				break;
			case 13:
				so(t);
				break;
			case 19:
				M(co);
				break;
			case 10:
				qi(t.type);
				break;
			case 22:
			case 23:
				so(t), eo(), e !== null && M(ga);
				break;
			case 24: qi(aa);
		}
	}
	function Hc(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Uc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Z(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Wc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Ya(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Gc(e, t, n) {
		n.props = Ks(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Kc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Z(e, t, n);
		}
	}
	function qc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				Z(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				Z(e, t, n);
			}
			else n.current = null;
		}
	}
	function Jc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Yc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[ut] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Xc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4;
	}
	function Zc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Xc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Qc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Qt));
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Qc(e, t, n), e = e.sibling; e !== null;) Qc(e, t, n), e = e.sibling;
	}
	function $c(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for ($c(e, t, n), e = e.sibling; e !== null;) $c(e, t, n), e = e.sibling;
	}
	function el(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[lt] = e, t[ut] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var tl = !1, nl = !1, rl = !1, il = typeof WeakSet == "function" ? WeakSet : Set, al = null;
	function ol(e, t) {
		if (e = e.containerInfo, Rd = sp, e = Er(e), Dr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (zd = {
			focusedElem: e,
			selectionRange: n
		}, sp = !1, al = t; al !== null;) if (t = al, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, al = e;
		else for (; al !== null;) {
			switch (t = al, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Ks(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Z(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) ef(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								ef(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, al = e;
				break;
			}
			al = t.return;
		}
	}
	function sl(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				xl(e, n), r & 4 && Hc(5, n);
				break;
			case 1:
				if (xl(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Z(n, n.return, e);
					}
					else {
						var i = Ks(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Z(n, n.return, e);
						}
					}
				}
				r & 64 && Wc(n), r & 512 && Kc(n, n.return);
				break;
			case 3:
				if (xl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Ya(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && el(n);
			case 26:
			case 5:
				xl(e, n), t === null && r & 4 && Jc(n), r & 512 && Kc(n, n.return);
				break;
			case 12:
				xl(e, n);
				break;
			case 31:
				xl(e, n), r & 4 && W(e, n);
				break;
			case 13:
				xl(e, n), r & 4 && pl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = Ju.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || tl, !r) {
					t = t !== null && t.memoizedState !== null || nl, i = tl;
					var a = nl;
					tl = r, (nl = t) && !a ? Cl(e, n, !!(n.subtreeFlags & 8772)) : xl(e, n), tl = i, nl = a;
				}
				break;
			case 30: break;
			default: xl(e, n);
		}
	}
	function cl(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, cl(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && gt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var ll = null, ul = !1;
	function dl(e, t, n) {
		for (n = n.child; n !== null;) fl(e, t, n), n = n.sibling;
	}
	function fl(e, t, n) {
		if (Be && typeof Be.onCommitFiberUnmount == "function") try {
			Be.onCommitFiberUnmount(ze, n);
		} catch {}
		switch (n.tag) {
			case 26:
				nl || qc(n, t), dl(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				nl || qc(n, t);
				var r = ll, i = ul;
				Zd(n.type) && (ll = n.stateNode, ul = !1), dl(e, t, n), pf(n.stateNode), ll = r, ul = i;
				break;
			case 5: nl || qc(n, t);
			case 6:
				if (r = ll, i = ul, ll = null, dl(e, t, n), ll = r, ul = i, ll !== null) {
					if (ul) try {
						(ll.nodeType === 9 ? ll.body : ll.nodeName === "HTML" ? ll.ownerDocument.body : ll).removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						ll.removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
				}
				break;
			case 18:
				ll !== null && (ul ? (e = ll, Qd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(ll, n.stateNode));
				break;
			case 4:
				r = ll, i = ul, ll = n.stateNode.containerInfo, ul = !0, dl(e, t, n), ll = r, ul = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Uc(2, n, t), nl || Uc(4, n, t), dl(e, t, n);
				break;
			case 1:
				nl || (qc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Gc(n, t, r)), dl(e, t, n);
				break;
			case 21:
				dl(e, t, n);
				break;
			case 22:
				nl = (r = nl) || n.memoizedState !== null, dl(e, t, n), nl = r;
				break;
			default: dl(e, t, n);
		}
	}
	function W(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Z(t, t.return, e);
			}
		}
	}
	function pl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function ml(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new il()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new il()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function hl(e, t) {
		var n = ml(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Yu.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function gl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Zd(c.type)) {
							ll = c.stateNode, ul = !1;
							break a;
						}
						break;
					case 5:
						ll = c.stateNode, ul = !1;
						break a;
					case 3:
					case 4:
						ll = c.stateNode.containerInfo, ul = !0;
						break a;
				}
				c = c.return;
			}
			if (ll === null) throw Error(i(160));
			fl(o, s, a), ll = null, ul = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) vl(t, e), t = t.sibling;
	}
	var _l = null;
	function vl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				gl(t, e), yl(e), r & 4 && (Uc(3, e, e.return), Hc(3, e), Uc(5, e, e.return));
				break;
			case 1:
				gl(t, e), yl(e), r & 512 && (nl || n === null || qc(n, n.return)), r & 64 && tl && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = _l;
				if (gl(t, e), yl(e), r & 512 && (nl || n === null || qc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) {
						if (r === null) {
							if (e.stateNode === null) {
								a: {
									r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
									b: switch (r) {
										case "title":
											o = a.getElementsByTagName("title")[0], (!o || o[ht] || o[lt] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[lt] = e, xt(o), r = o;
											break a;
										case "link":
											var s = Vf("link", "href", a).get(r + (n.href || ""));
											if (s) {
												for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
											break;
										case "meta":
											if (s = Vf("meta", "content", a).get(r + (n.content || ""))) {
												for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
											break;
										default: throw Error(i(468, r));
									}
									o[lt] = e, xt(o), r = o;
								}
								e.stateNode = r;
							} else Hf(a, e.type, e.stateNode);
						} else e.stateNode = If(a, r, e.memoizedProps);
					} else o === r ? r === null && e.stateNode !== null && Yc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				gl(t, e), yl(e), r & 512 && (nl || n === null || qc(n, n.return)), n !== null && r & 4 && Yc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (gl(t, e), yl(e), r & 512 && (nl || n === null || qc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Wt(a, "");
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Yc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (rl = !0);
				break;
			case 6:
				if (gl(t, e), yl(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Bf = null, a = _l, _l = gf(t.containerInfo), gl(t, e), _l = a, yl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				rl && (rl = !1, bl(e));
				break;
			case 4:
				r = _l, _l = gf(e.stateNode.containerInfo), gl(t, e), yl(e), _l = r;
				break;
			case 12:
				gl(t, e), yl(e);
				break;
			case 31:
				gl(t, e), yl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, hl(e, r)));
				break;
			case 13:
				gl(t, e), yl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (tu = Ae()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, hl(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = tl, d = nl;
				if (tl = u || a, nl = d || l, gl(t, e), nl = d, tl = u, yl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || tl || nl || Sl(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? $d(m, !0) : $d(l.stateNode, !1);
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, hl(e, n))));
				break;
			case 19:
				gl(t, e), yl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, hl(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: gl(t, e), yl(e);
		}
	}
	function yl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Xc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						$c(e, Zc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Wt(o, ""), n.flags &= -33), $c(e, Zc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Qc(e, Zc(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Z(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function bl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			bl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function xl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) sl(e, t.alternate, t), t = t.sibling;
	}
	function Sl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Uc(4, t, t.return), Sl(t);
					break;
				case 1:
					qc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Gc(t, t.return, n), Sl(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					qc(t, t.return), Sl(t);
					break;
				case 22:
					t.memoizedState === null && Sl(t);
					break;
				case 30:
					Sl(t);
					break;
				default: Sl(t);
			}
			e = e.sibling;
		}
	}
	function Cl(e, t, n) {
		for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Cl(i, a, n), Hc(4, a);
					break;
				case 1:
					if (Cl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ja(c[i], s);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					n && o & 64 && Wc(a), Kc(a, a.return);
					break;
				case 27: el(a);
				case 26:
				case 5:
					Cl(i, a, n), n && r === null && o & 4 && Jc(a), Kc(a, a.return);
					break;
				case 12:
					Cl(i, a, n);
					break;
				case 31:
					Cl(i, a, n), n && o & 4 && W(i, a);
					break;
				case 13:
					Cl(i, a, n), n && o & 4 && pl(i, a);
					break;
				case 22:
					a.memoizedState === null && Cl(i, a, n), Kc(a, a.return);
					break;
				case 30: break;
				default: Cl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function wl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && sa(n));
	}
	function Tl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && sa(e));
	}
	function El(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) Dl(e, t, n, r), t = t.sibling;
	}
	function Dl(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				El(e, t, n, r), i & 2048 && Hc(9, t);
				break;
			case 1:
				El(e, t, n, r);
				break;
			case 3:
				El(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && sa(e)));
				break;
			case 12:
				if (i & 2048) {
					El(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else El(e, t, n, r);
				break;
			case 31:
				El(e, t, n, r);
				break;
			case 13:
				El(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? El(e, t, n, r) : (a._visibility |= 2, Ol(e, t, n, r, !!(t.subtreeFlags & 10256) || !1)) : a._visibility & 2 ? El(e, t, n, r) : kl(e, t), i & 2048 && wl(o, t);
				break;
			case 24:
				El(e, t, n, r), i & 2048 && Tl(t.alternate, t);
				break;
			default: El(e, t, n, r);
		}
	}
	function Ol(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Ol(a, o, s, c, i), Hc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Ol(a, o, s, c, i)) : u._visibility & 2 ? Ol(a, o, s, c, i) : kl(a, o), i && l & 2048 && wl(o.alternate, o);
					break;
				case 24:
					Ol(a, o, s, c, i), i && l & 2048 && Tl(o.alternate, o);
					break;
				default: Ol(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function kl(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					kl(n, r), i & 2048 && wl(r.alternate, r);
					break;
				case 24:
					kl(n, r), i & 2048 && Tl(r.alternate, r);
					break;
				default: kl(n, r);
			}
			t = t.sibling;
		}
	}
	var Al = 8192;
	function jl(e, t, n) {
		if (e.subtreeFlags & Al) for (e = e.child; e !== null;) Ml(e, t, n), e = e.sibling;
	}
	function Ml(e, t, n) {
		switch (e.tag) {
			case 26:
				jl(e, t, n), e.flags & Al && e.memoizedState !== null && Gf(n, _l, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				jl(e, t, n);
				break;
			case 3:
			case 4:
				var r = _l;
				_l = gf(e.stateNode.containerInfo), jl(e, t, n), _l = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Al, Al = 16777216, jl(e, t, n), Al = r) : jl(e, t, n));
				break;
			default: jl(e, t, n);
		}
	}
	function Nl(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Pl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				al = r, Ll(r, e);
			}
			Nl(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Fl(e), e = e.sibling;
	}
	function Fl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Pl(e), e.flags & 2048 && Uc(9, e, e.return);
				break;
			case 3:
				Pl(e);
				break;
			case 12:
				Pl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Il(e)) : Pl(e);
				break;
			default: Pl(e);
		}
	}
	function Il(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				al = r, Ll(r, e);
			}
			Nl(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Uc(8, t, t.return), Il(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Il(t));
					break;
				default: Il(t);
			}
			e = e.sibling;
		}
	}
	function Ll(e, t) {
		for (; al !== null;) {
			var n = al;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Uc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: sa(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, al = r;
			else a: for (n = e; al !== null;) {
				r = al;
				var i = r.sibling, a = r.return;
				if (cl(r), r === n) {
					al = null;
					break a;
				}
				if (i !== null) {
					i.return = a, al = i;
					break a;
				}
				al = a;
			}
		}
	}
	var Rl = {
		getCacheForType: function(e) {
			var t = $i(aa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return $i(aa).controller.signal;
		}
	}, zl = typeof WeakMap == "function" ? WeakMap : Map, G = 0, Bl = null, K = null, q = 0, J = 0, Vl = null, Hl = !1, Ul = !1, Wl = !1, Gl = 0, Kl = 0, ql = 0, Jl = 0, Yl = 0, Xl = 0, Zl = 0, Ql = null, $l = null, eu = !1, tu = 0, nu = 0, ru = Infinity, iu = null, au = null, ou = 0, Y = null, X = null, su = 0, cu = 0, lu = null, uu = null, du = 0, fu = null;
	function pu() {
		return G & 2 && q !== 0 ? q & -q : O.T === null ? ot() : dd();
	}
	function mu() {
		if (Xl === 0) {
			if (!(q & 536870912) || V) {
				var e = qe;
				qe <<= 1, !(qe & 3932160) && (qe = 262144), Xl = e;
			} else Xl = 536870912;
		}
		return e = to.current, e !== null && (e.flags |= 32), Xl;
	}
	function hu(e, t, n) {
		(e === Bl && (J === 2 || J === 9) || e.cancelPendingCommit !== null) && (Su(e, 0), yu(e, q, Xl, !1)), et(e, n), (!(G & 2) || e !== Bl) && (e === Bl && (!(G & 2) && (Jl |= n), Kl === 4 && yu(e, q, Xl, !1)), rd(e));
	}
	function gu(e, t, n) {
		if (G & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || Xe(e, t), a = r ? Au(e, t) : Ou(e, t, !0), o = r;
		do {
			if (a === 0) {
				Ul && !r && yu(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !vu(n)) {
				a = Ou(e, t, !1), o = !1;
				continue;
			}
			if (a === 2) {
				if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
				else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
				if (s !== 0) {
					t = s;
					a: {
						var c = e;
						a = Ql;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (Su(c, s).flags |= 256), s = Ou(c, s, !1), s !== 2) {
							if (Wl && !l) {
								c.errorRecoveryDisabledLanes |= o, Jl |= o, a = 4;
								break a;
							}
							o = $l, $l = a, o !== null && ($l === null ? $l = o : $l.push.apply($l, o));
						}
						a = s;
					}
					if (o = !1, a !== 2) continue;
				}
			}
			if (a === 1) {
				Su(e, 0), yu(e, t, 0, !0);
				break;
			}
			a: {
				switch (r = e, o = a, o) {
					case 0:
					case 1: throw Error(i(345));
					case 4: if ((t & 4194048) !== t) break;
					case 6:
						yu(r, t, Xl, !Hl);
						break a;
					case 2:
						$l = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = tu + 300 - Ae(), 10 < a)) {
					if (yu(r, t, Xl, !Hl), Ye(r, 0, !0) !== 0) break a;
					su = t, r.timeoutHandle = Kd(_u.bind(null, r, n, $l, iu, eu, t, Xl, Jl, Zl, Hl, o, "Throttled", -0, 0), a);
					break a;
				}
				_u(r, n, $l, iu, eu, t, Xl, Jl, Zl, Hl, o, null, -0, 0);
			}
			break;
		} while (1);
		rd(e);
	}
	function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: Qt
			}, Ml(t, a, d);
			var m = (a & 62914560) === a ? tu - Ae() : (a & 4194048) === a ? nu - Ae() : 0;
			if (m = qf(d, m), m !== null) {
				su = a, e.cancelPendingCommit = m(Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), yu(e, a, o, !l);
				return;
			}
		}
		Lu(e, t, a, n, r, i, o, s, c);
	}
	function vu(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!xr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function yu(e, t, n, r) {
		t &= ~Yl, t &= ~Jl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - He(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && nt(e, n, t);
	}
	function bu() {
		return G & 6 ? !0 : (id(0, !1), !1);
	}
	function xu() {
		if (K !== null) {
			if (J === 0) var e = K.return;
			else e = K, Gi = Wi = null, Oo(e), Aa = null, ja = 0, e = K;
			for (; e !== null;) Vc(e.alternate, e), e = e.return;
			K = null;
		}
	}
	function Su(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), su = 0, xu(), Bl = e, K = n = li(e.current, null), q = t, J = 0, Vl = null, Hl = !1, Ul = Xe(e, t), Wl = !1, Zl = Xl = Yl = Jl = ql = Kl = 0, $l = Ql = null, eu = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - He(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Gl = t, $r(), n;
	}
	function Cu(e, t) {
		H = null, O.H = Rs, t === ba || t === Sa ? (t = Oa(), J = 3) : t === xa ? (t = Oa(), J = 4) : J = t === nc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Vl = t, K === null && (Kl = 1, Xs(e, _i(t, e.current)));
	}
	function wu() {
		var e = to.current;
		return e === null ? !0 : (q & 4194048) === q ? no === null : (q & 62914560) === q || q & 536870912 ? e === no : !1;
	}
	function Tu() {
		var e = O.H;
		return O.H = Rs, e === null ? Rs : e;
	}
	function Eu() {
		var e = O.A;
		return O.A = Rl, e;
	}
	function Du() {
		Kl = 4, Hl || (q & 4194048) !== q && to.current !== null || (Ul = !0), !(ql & 134217727) && !(Jl & 134217727) || Bl === null || yu(Bl, q, Xl, !1);
	}
	function Ou(e, t, n) {
		var r = G;
		G |= 2;
		var i = Tu(), a = Eu();
		(Bl !== e || q !== t) && (iu = null, Su(e, t)), t = !1;
		var o = Kl;
		a: do
			try {
				if (J !== 0 && K !== null) {
					var s = K, c = Vl;
					switch (J) {
						case 8:
							xu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							to.current === null && (t = !0);
							var l = J;
							if (J = 0, Vl = null, Pu(e, s, c, l), n && Ul) {
								o = 0;
								break a;
							}
							break;
						default: l = J, J = 0, Vl = null, Pu(e, s, c, l);
					}
				}
				ku(), o = Kl;
				break;
			} catch (t) {
				Cu(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Gi = Wi = null, G = r, O.H = i, O.A = a, K === null && (Bl = null, q = 0, $r()), o;
	}
	function ku() {
		for (; K !== null;) Mu(K);
	}
	function Au(e, t) {
		var n = G;
		G |= 2;
		var r = Tu(), a = Eu();
		Bl !== e || q !== t ? (iu = null, ru = Ae() + 500, Su(e, t)) : Ul = Xe(e, t);
		a: do
			try {
				if (J !== 0 && K !== null) {
					t = K;
					var o = Vl;
					b: switch (J) {
						case 1:
							J = 0, Vl = null, Pu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (wa(o)) {
								J = 0, Vl = null, Nu(t);
								break;
							}
							t = function() {
								J !== 2 && J !== 9 || Bl !== e || (J = 7), rd(e);
							}, o.then(t, t);
							break a;
						case 3:
							J = 7;
							break a;
						case 4:
							J = 5;
							break a;
						case 7:
							wa(o) ? (J = 0, Vl = null, Nu(t)) : (J = 0, Vl = null, Pu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (K.tag) {
								case 26: s = K.memoizedState;
								case 5:
								case 27:
									var c = K;
									if (s ? Wf(s) : c.stateNode.complete) {
										J = 0, Vl = null;
										var l = c.sibling;
										if (l !== null) K = l;
										else {
											var u = c.return;
											u === null ? K = null : (K = u, Fu(u));
										}
										break b;
									}
							}
							J = 0, Vl = null, Pu(e, t, o, 5);
							break;
						case 6:
							J = 0, Vl = null, Pu(e, t, o, 6);
							break;
						case 8:
							xu(), Kl = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				ju();
				break;
			} catch (t) {
				Cu(e, t);
			}
		while (1);
		return Gi = Wi = null, O.H = r, O.A = a, G = n, K === null ? (Bl = null, q = 0, $r(), Kl) : 0;
	}
	function ju() {
		for (; K !== null && !Oe();) Mu(K);
	}
	function Mu(e) {
		var t = Mc(e.alternate, e, Gl);
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : K = t;
	}
	function Nu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = gc(n, t, t.pendingProps, t.type, void 0, q);
				break;
			case 11:
				t = gc(n, t, t.pendingProps, t.type.render, t.ref, q);
				break;
			case 5: Oo(t);
			default: Vc(n, t), t = K = ui(t, Gl), t = Mc(n, t, Gl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : K = t;
	}
	function Pu(e, t, n, r) {
		Gi = Wi = null, Oo(t), Aa = null, ja = 0;
		var i = t.return;
		try {
			if (tc(e, i, t, n, q)) {
				Kl = 1, Xs(e, _i(n, e.current)), K = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw K = i, t;
			Kl = 1, Xs(e, _i(n, e.current)), K = null;
			return;
		}
		t.flags & 32768 ? (V || r === 1 ? e = !0 : Ul || q & 536870912 ? e = !1 : (Hl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = to.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Iu(t, e)) : Fu(t);
	}
	function Fu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Iu(t, Hl);
				return;
			}
			e = t.return;
			var n = zc(t.alternate, t, Gl);
			if (n !== null) {
				K = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				K = t;
				return;
			}
			K = t = e;
		} while (t !== null);
		Kl === 0 && (Kl = 5);
	}
	function Iu(e, t) {
		do {
			var n = Bc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, K = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				K = e;
				return;
			}
			K = e = n;
		} while (e !== null);
		Kl = 6, K = null;
	}
	function Lu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			Hu();
		while (ou !== 0);
		if (G & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= Qr, tt(e, n, o, s, c, l), e === Bl && (K = Bl = null, q = 0), X = t, Y = e, su = n, cu = o, lu = a, uu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Xu(Pe, function() {
				return Uu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = O.T, O.T = null, a = k.p, k.p = 2, s = G, G |= 4;
				try {
					ol(e, t, n);
				} finally {
					G = s, k.p = a, O.T = r;
				}
			}
			ou = 1, Ru(), zu(), Bu();
		}
	}
	function Ru() {
		if (ou === 1) {
			ou = 0;
			var e = Y, t = X, n = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || n) {
				n = O.T, O.T = null;
				var r = k.p;
				k.p = 2;
				var i = G;
				G |= 4;
				try {
					vl(t, e);
					var a = zd, o = Er(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && Tr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Dr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = wr(s, h), v = wr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					sp = !!Rd, zd = Rd = null;
				} finally {
					G = i, k.p = r, O.T = n;
				}
			}
			e.current = t, ou = 2;
		}
	}
	function zu() {
		if (ou === 2) {
			ou = 0;
			var e = Y, t = X, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = O.T, O.T = null;
				var r = k.p;
				k.p = 2;
				var i = G;
				G |= 4;
				try {
					sl(e, t.alternate, t);
				} finally {
					G = i, k.p = r, O.T = n;
				}
			}
			ou = 3;
		}
	}
	function Bu() {
		if (ou === 4 || ou === 3) {
			ou = 0, ke();
			var e = Y, t = X, n = su, r = uu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? ou = 5 : (ou = 0, X = Y = null, Vu(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (au = null), at(n), t = t.stateNode, Be && typeof Be.onCommitFiberRoot == "function") try {
				Be.onCommitFiberRoot(ze, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = O.T, i = k.p, k.p = 2, O.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					O.T = t, k.p = i;
				}
			}
			su & 3 && Hu(), rd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === fu ? du++ : (du = 0, fu = e) : du = 0, id(0, !1);
		}
	}
	function Vu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, sa(t)));
	}
	function Hu() {
		return Ru(), zu(), Bu(), Uu();
	}
	function Uu() {
		if (ou !== 5) return !1;
		var e = Y, t = cu;
		cu = 0;
		var n = at(su), r = O.T, a = k.p;
		try {
			k.p = 32 > n ? 32 : n, O.T = null, n = lu, lu = null;
			var o = Y, s = su;
			if (ou = 0, X = Y = null, su = 0, G & 6) throw Error(i(331));
			var c = G;
			if (G |= 4, Fl(o.current), Dl(o, o.current, s, n), G = c, id(0, !1), Be && typeof Be.onPostCommitFiberRoot == "function") try {
				Be.onPostCommitFiberRoot(ze, o);
			} catch {}
			return !0;
		} finally {
			k.p = a, O.T = r, Vu(e, t);
		}
	}
	function Wu(e, t, n) {
		t = _i(n, t), t = Qs(e.stateNode, t, 2), e = Ha(e, t, 2), e !== null && (et(e, 2), rd(e));
	}
	function Z(e, t, n) {
		if (e.tag === 3) Wu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Wu(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (au === null || !au.has(r))) {
					e = _i(n, e), n = $s(2), r = Ha(t, n, 2), r !== null && (ec(n, r, t, e), et(r, 2), rd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new zl();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Wl = !0, i.add(n), e = Ku.bind(null, e, t, n), t.then(e, e));
	}
	function Ku(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Bl === e && (q & n) === n && (Kl === 4 || Kl === 3 && (q & 62914560) === q && 300 > Ae() - tu ? !(G & 2) && Su(e, 0) : Yl |= n, Zl === q && (Zl = 0)), rd(e);
	}
	function qu(e, t) {
		t === 0 && (t = Qe()), e = ni(e, t), e !== null && (et(e, t), rd(e));
	}
	function Ju(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), qu(e, n);
	}
	function Yu(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), qu(e, n);
	}
	function Xu(e, t) {
		return Ee(e, t);
	}
	var Zu = null, Qu = null, $u = !1, ed = !1, td = !1, nd = 0;
	function rd(e) {
		e !== Qu && e.next === null && (Qu === null ? Zu = Qu = e : Qu = Qu.next = e), ed = !0, $u || ($u = !0, ud());
	}
	function id(e, t) {
		if (!td && ed) {
			td = !0;
			do
				for (var n = !1, r = Zu; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - He(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, ld(r, a));
						} else a = q, a = Ye(r, r === Bl ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Xe(r, a) || (n = !0, ld(r, a));
					}
					r = r.next;
				}
			while (n);
			td = !1;
		}
	}
	function ad() {
		od();
	}
	function od() {
		ed = $u = !1;
		var e = 0;
		nd !== 0 && Gd() && (e = nd);
		for (var t = Ae(), n = null, r = Zu; r !== null;) {
			var i = r.next, a = sd(r, t);
			a === 0 ? (r.next = null, n === null ? Zu = i : n.next = i, i === null && (Qu = n)) : (n = r, (e !== 0 || a & 3) && (ed = !0)), r = i;
		}
		ou !== 0 && ou !== 5 || id(e, !1), nd !== 0 && (nd = 0);
	}
	function sd(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - He(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Ze(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Bl, n = q, n = Ye(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (J === 2 || J === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && De(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Xe(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && De(r), at(n)) {
				case 2:
				case 8:
					n = Ne;
					break;
				case 32:
					n = Pe;
					break;
				case 268435456:
					n = Ie;
					break;
				default: n = Pe;
			}
			return r = cd.bind(null, e), n = Ee(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && De(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function cd(e, t) {
		if (ou !== 0 && ou !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (Hu() && e.callbackNode !== n) return null;
		var r = q;
		return r = Ye(e, e === Bl ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (gu(e, r, t), sd(e, Ae()), e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null);
	}
	function ld(e, t) {
		if (Hu()) return null;
		gu(e, t, !0);
	}
	function ud() {
		Yd(function() {
			G & 6 ? Ee(Me, ad) : od();
		});
	}
	function dd() {
		if (nd === 0) {
			var e = ua;
			e === 0 && (e = Ke, Ke <<= 1, !(Ke & 261888) && (Ke = 256)), nd = e;
		}
		return nd;
	}
	function fd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Zt("" + e);
	}
	function pd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function md(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = fd((i[ut] || null).action), o = r.submitter;
			o && (t = (t = o[ut] || null) ? fd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new bn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (nd !== 0) {
								var e = o ? pd(i, o) : new FormData(i);
								ws(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? pd(i, o) : new FormData(i), ws(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var hd = 0; hd < qr.length; hd++) {
		var gd = qr[hd];
		Jr(gd.toLowerCase(), "on" + (gd[0].toUpperCase() + gd.slice(1)));
	}
	Jr(zr, "onAnimationEnd"), Jr(Br, "onAnimationIteration"), Jr(Vr, "onAnimationStart"), Jr("dblclick", "onDoubleClick"), Jr("focusin", "onFocus"), Jr("focusout", "onBlur"), Jr(Hr, "onTransitionRun"), Jr(Ur, "onTransitionStart"), Jr(Wr, "onTransitionCancel"), Jr(Gr, "onTransitionEnd"), wt("onMouseEnter", ["mouseout", "mouseover"]), wt("onMouseLeave", ["mouseout", "mouseover"]), wt("onPointerEnter", ["pointerout", "pointerover"]), wt("onPointerLeave", ["pointerout", "pointerover"]), Ct("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Ct("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Ct("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Ct("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Ct("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Ct("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var _d = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), vd = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(_d));
	function yd(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Yr(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Yr(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[ft];
		n === void 0 && (n = t[ft] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Cd(t, e, 2, !1), n.add(r));
	}
	function bd(e, t, n) {
		var r = 0;
		t && (r |= 4), Cd(n, e, r, t);
	}
	var xd = "_reactListening" + Math.random().toString(36).slice(2);
	function Sd(e) {
		if (!e[xd]) {
			e[xd] = !0, L.forEach(function(t) {
				t !== "selectionchange" && (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[xd] || (t[xd] = !0, bd("selectionchange", !1, t));
		}
	}
	function Cd(e, t, n, r) {
		switch (mp(t)) {
			case 2:
				var i = cp;
				break;
			case 8:
				i = lp;
				break;
			default: i = up;
		}
		n = i.bind(null, t, n, e), i = void 0, !ln || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function wd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = _t(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		on(function() {
			var r = a, i = en(n), s = [];
			a: {
				var c = Kr.get(e);
				if (c !== void 0) {
					var l = bn, u = e;
					switch (e) {
						case "keypress": if (hn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Rn;
							break;
						case "focusin":
							u = "focus", l = kn;
							break;
						case "focusout":
							u = "blur", l = kn;
							break;
						case "beforeblur":
						case "afterblur":
							l = kn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Dn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = On;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Bn;
							break;
						case zr:
						case Br:
						case Vr:
							l = An;
							break;
						case Gr:
							l = Vn;
							break;
						case "scroll":
						case "scrollend":
							l = Sn;
							break;
						case "wheel":
							l = Hn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = jn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = zn;
							break;
						case "toggle":
						case "beforetoggle": l = Un;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = sn(m, p), g != null && d.push(Td(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== $t && (u = n.relatedTarget || n.fromElement) && (_t(u) || u[dt])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? _t(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = Dn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = zn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : yt(l), h = u == null ? c : yt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, _t(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Dd, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Od(s, c, l, d, !1), u !== null && f !== null && Od(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? yt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = lr;
					else if (rr(c)) {
						if (ur) v = yr;
						else {
							v = _r;
							var y = gr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Jt(r.elementType) && (v = lr) : v = vr;
					if (v &&= v(e, r)) {
						ir(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && z(c, "number", c.value);
				}
				switch (y = r ? yt(r) : window, e) {
					case "focusin":
						(rr(y) || y.contentEditable === "true") && (kr = y, Ar = r, jr = null);
						break;
					case "focusout":
						jr = Ar = kr = null;
						break;
					case "mousedown":
						Mr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Mr = !1, Nr(s, n, i);
						break;
					case "selectionchange": if (Or) break;
					case "keydown":
					case "keyup": Nr(s, n, i);
				}
				var b;
				if (Gn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else $n ? Zn(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (Jn && n.locale !== "ko" && ($n || x !== "onCompositionStart" ? x === "onCompositionEnd" && $n && (b = mn()) : (dn = i, fn = "value" in dn ? dn.value : dn.textContent, $n = !0)), y = Ed(r, x), 0 < y.length && (x = new Mn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = Qn(n), b !== null && (x.data = b)))), (b = qn ? er(e, n) : tr(e, n)) && (x = Ed(r, "onBeforeInput"), 0 < x.length && (y = new Mn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), md(s, e, r, n, i);
			}
			yd(s, t);
		});
	}
	function Td(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Ed(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = sn(e, n), i != null && r.unshift(Td(e, i, a)), i = sn(e, t), i != null && r.push(Td(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Dd(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Od(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = sn(n, a), l != null && o.unshift(Td(n, l, c))) : i || (l = sn(n, a), l != null && o.push(Td(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var kd = /\r\n?/g, Ad = /\u0000|\uFFFD/g;
	function jd(e) {
		return (typeof e == "string" ? e : "" + e).replace(kd, "\n").replace(Ad, "");
	}
	function Md(e, t) {
		return t = jd(t), jd(e) === t;
	}
	function $(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Wt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Wt(e, "" + r);
				break;
			case "className":
				At(e, "class", r);
				break;
			case "tabIndex":
				At(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				At(e, n, r);
				break;
			case "style":
				qt(e, r, o);
				break;
			case "data": if (t !== "object") {
				At(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Zt("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && $(e, t, "name", a.name, a, null), $(e, t, "formEncType", a.formEncType, a, null), $(e, t, "formMethod", a.formMethod, a, null), $(e, t, "formTarget", a.formTarget, a, null)) : ($(e, t, "encType", a.encType, a, null), $(e, t, "method", a.method, a, null), $(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Zt("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = Qt);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Zt("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Q("beforetoggle", e), Q("toggle", e), kt(e, "popover", r);
				break;
			case "xlinkActuate":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				jt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				jt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				jt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				kt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Yt.get(n) || n, kt(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				qt(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? Wt(e, r) : (typeof r == "number" || typeof r == "bigint") && Wt(e, "" + r);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = Qt);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!St.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[ut] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : kt(e, n, r);
			}
		}
	}
	function Pd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Q("error", e), Q("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: $(e, t, o, s, n, null);
					}
				}
				a && $(e, t, "srcSet", n.srcSet, n, null), r && $(e, t, "src", n.src, n, null);
				return;
			case "input":
				Q("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: $(e, t, r, d, n, null);
					}
				}
				Bt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Q("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: $(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Vt(e, !!r, n, !0) : Vt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Q("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: $(e, t, s, c, n, null);
				}
				Ut(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: $(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Q("beforetoggle", e), Q("toggle", e), Q("cancel", e), Q("close", e);
				break;
			case "iframe":
			case "object":
				Q("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < _d.length; r++) Q(_d[r], e);
				break;
			case "image":
				Q("error", e), Q("load", e);
				break;
			case "details":
				Q("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Q("error", e), Q("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: $(e, t, u, r, n, null);
				}
				return;
			default: if (Jt(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null));
	}
	function Fd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || $(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && $(e, t, p, m, r, f);
					}
				}
				R(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || $(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && $(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Vt(e, !!n, n ? [] : "", !1) : Vt(e, !!n, t, !0)) : Vt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: $(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && $(e, t, s, a, r, o);
				}
				Ht(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: $(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: $(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: $(e, t, u, p, r, m);
				}
				return;
			default: if (Jt(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m);
	}
	function Id(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Ld() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Id(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Rd = null, zd = null;
	function Bd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Vd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Hd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Ud(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Wd = null;
	function Gd() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== Wd && (Wd = e, !0) : (Wd = null, !1);
	}
	var Kd = typeof setTimeout == "function" ? setTimeout : void 0, qd = typeof clearTimeout == "function" ? clearTimeout : void 0, Jd = typeof Promise == "function" ? Promise : void 0, Yd = typeof queueMicrotask == "function" ? queueMicrotask : Jd === void 0 ? Kd : function(e) {
		return Jd.resolve(null).then(e).catch(Xd);
	};
	function Xd(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Zd(e) {
		return e === "head";
	}
	function Qd(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Np(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") pf(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, pf(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[ht] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && pf(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Np(t);
	}
	function $d(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function ef(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					ef(n), gt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function tf(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[ht]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = cf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function nf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function rf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function af(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function of(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function sf(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function cf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var lf = null;
	function uf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return cf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function df(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function ff(e, t, n) {
		switch (t = Bd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function pf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		gt(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = k.d;
	k.d = {
		f: vf,
		r: yf,
		D: Sf,
		C: Cf,
		L: wf,
		m: Tf,
		X: Df,
		S: Ef,
		M: Of
	};
	function vf() {
		var e = _f.f(), t = bu();
		return e || t;
	}
	function yf(e) {
		var t = vt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Es(t) : _f.r(e);
	}
	var bf = typeof document > "u" ? null : document;
	function xf(e, t, n) {
		var r = bf;
		if (r && typeof t == "string" && t) {
			var i = zt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), hf.has(i) || (hf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Pd(t, "link", e), xt(t), r.head.appendChild(t)));
		}
	}
	function Sf(e) {
		_f.D(e), xf("dns-prefetch", e, null);
	}
	function Cf(e, t) {
		_f.C(e, t), xf("preconnect", e, t);
	}
	function wf(e, t, n) {
		_f.L(e, t, n);
		var r = bf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + zt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + zt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + zt(n.imageSizes) + "\"]")) : i += "[href=\"" + zt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Af(e);
					break;
				case "script": a = Pf(e);
			}
			mf.has(a) || (e = h({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), mf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(jf(a)) || t === "script" && r.querySelector(Ff(a)) || (t = r.createElement("link"), Pd(t, "link", e), xt(t), r.head.appendChild(t)));
		}
	}
	function Tf(e, t) {
		_f.m(e, t);
		var n = bf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + zt(r) + "\"][href=\"" + zt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Pf(e);
			}
			if (!mf.has(a) && (e = h({
				rel: "modulepreload",
				href: e
			}, t), mf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Ff(a))) return;
				}
				r = n.createElement("link"), Pd(r, "link", e), xt(r), n.head.appendChild(r);
			}
		}
	}
	function Ef(e, t, n) {
		_f.S(e, t, n);
		var r = bf;
		if (r && e) {
			var i = bt(r).hoistableStyles, a = Af(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(jf(a))) s.loading = 5;
				else {
					e = h({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = mf.get(a)) && Rf(e, n);
					var c = o = r.createElement("link");
					xt(c), Pd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Lf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Df(e, t) {
		_f.X(e, t);
		var n = bf;
		if (n && e) {
			var r = bt(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), xt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Of(e, t) {
		_f.M(e, t);
		var n = bf;
		if (n && e) {
			var r = bt(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), xt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function kf(e, t, n, r) {
		var a = (a = fe.current) ? gf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = bt(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Af(n.href);
					var o = bt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = bt(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Af(e) {
		return "href=\"" + zt(e) + "\"";
	}
	function jf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Mf(e) {
		return h({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Nf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Pd(t, "link", n), xt(t), e.head.appendChild(t));
	}
	function Pf(e) {
		return "[src=\"" + zt(e) + "\"]";
	}
	function Ff(e) {
		return "script[async]" + e;
	}
	function If(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + zt(n.href) + "\"]");
				if (r) return t.instance = r, xt(r), r;
				var a = h({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), xt(r), Pd(r, "style", a), Lf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Af(n.href);
				var o = e.querySelector(jf(a));
				if (o) return t.state.loading |= 4, t.instance = o, xt(o), o;
				r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement("link"), xt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Pd(o, "link", r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
			case "script": return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, xt(a), a) : (r = n, (a = mf.get(o)) && (r = h({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), xt(a), Pd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
		return t.instance;
	}
	function Lf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Rf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function zf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Bf = null;
	function Vf(e, t, n) {
		if (Bf === null) {
			var r = /* @__PURE__ */ new Map(), i = Bf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Bf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[ht] || a[lt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Hf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Uf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Wf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Gf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Af(r.href), a = t.querySelector(jf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, xt(a);
					return;
				}
				a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement("link"), xt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), Pd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Kf = 0;
	function qf(e, t) {
		return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Kf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Jf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) Xf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Yf = null;
	function Xf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = /* @__PURE__ */ new Map(), t.forEach(Zf, e), Yf = null, Jf.call(e));
	}
	function Zf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Yf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Yf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Qf = {
		$$typeof: C,
		Provider: null,
		Consumer: null,
		_currentValue: A,
		_currentValue2: A,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = $e(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = $e(0), this.hiddenUpdates = $e(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = si(3, null, null, t), e.current = a, a.stateNode = e, t = oa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, za(a), e;
	}
	function tp(e) {
		return e ? (e = ai, e) : ai;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Va(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ha(e, r, t), n !== null && (hu(n, e, t), Ua(n, e, t));
	}
	function rp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ip(e, t) {
		rp(e, t), (e = e.alternate) && rp(e, t);
	}
	function ap(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = ni(e, 67108864);
			t !== null && hu(t, e, 67108864), ip(e, 67108864);
		}
	}
	function op(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = pu();
			t = it(t);
			var n = ni(e, t);
			n !== null && hu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = O.T;
		O.T = null;
		var a = k.p;
		try {
			k.p = 2, up(e, t, n, r);
		} finally {
			k.p = a, O.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = O.T;
		O.T = null;
		var a = k.p;
		try {
			k.p = 8, up(e, t, n, r);
		} finally {
			k.p = a, O.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) wd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = vt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = P(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - He(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									rd(a), !(G & 6) && (ru = Ae() + 500, id(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = ni(a, 2), s !== null && hu(s, a, 2), bu(), ip(a, 2);
					}
					if (a = dp(r), a === null && wd(e, t, r, fp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else wd(e, t, r, null, n);
		}
	}
	function dp(e) {
		return e = en(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = _t(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return fp = e, null;
	}
	function mp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (je()) {
				case Me: return 2;
				case Ne: return 8;
				case Pe:
				case Fe: return 32;
				case Ie: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hp = !1, gp = null, _p = null, vp = null, yp = /* @__PURE__ */ new Map(), bp = /* @__PURE__ */ new Map(), xp = [], Sp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Cp(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				gp = null;
				break;
			case "dragenter":
			case "dragleave":
				_p = null;
				break;
			case "mouseover":
			case "mouseout":
				vp = null;
				break;
			case "pointerover":
			case "pointerout":
				yp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": bp.delete(t.pointerId);
		}
	}
	function wp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = vt(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Tp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return gp = wp(gp, e, t, n, r, i), !0;
			case "dragenter": return _p = wp(_p, e, t, n, r, i), !0;
			case "mouseover": return vp = wp(vp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Ep(e) {
		var t = _t(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, st(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, st(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Dp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				$t = r, n.target.dispatchEvent(r), $t = null;
			} else return t = vt(n), t !== null && ap(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Op(e, t, n) {
		Dp(e) && n.delete(t);
	}
	function kp() {
		hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op);
	}
	function Ap(e, n) {
		e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
	}
	var jp = null;
	function Mp(e) {
		jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			jp === e && (jp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (pp(r || n) === null) continue;
					break;
				}
				var a = vt(n);
				a !== null && (e.splice(t, 3), t -= 3, ws(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Np(e) {
		function t(t) {
			return Ap(t, e);
		}
		gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
		for (var n = 0; n < xp.length; n++) {
			var r = xp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[ut] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[ut] || null) s = o.formAction;
					else if (pp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n);
			}
		}
	}
	function Pp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Fp(e) {
		this._internalRoot = e;
	}
	Ip.prototype.render = Fp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		np(n, pu(), e, t, null, null);
	}, Ip.prototype.unmount = Fp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			np(e.current, 2, null, e, null, null), bu(), t[dt] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ot();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
			xp.splice(n, 0, e), n === 0 && Ep(e);
		}
	};
	var Lp = n.version;
	if (Lp !== "19.2.8") throw Error(i(527, Lp, "19.2.8"));
	k.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.8",
		rendererPackageName: "react-dom",
		currentDispatcherRef: O,
		reconcilerVersion: "19.2.8"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!zp.isDisabled && zp.supportsFiber) try {
			ze = zp.inject(Rp), Be = zp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = qs, s = Js, c = Ys;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[dt] = t.current, Sd(e), new Fp(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u(), 1), v = g(), y = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){:root,:host{--shimmer-angle:20deg}*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-pan-x:initial;--tw-pan-y:initial;--tw-pinch-zoom:initial;--tw-space-y-reverse:0;--tw-space-x-reverse:0;--tw-divide-x-reverse:0;--tw-border-style:solid;--tw-divide-y-reverse:0;--tw-leading:initial;--tw-font-weight:initial;--tw-tracking:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-content:\"\";--tw-animation-delay:0s;--tw-animation-direction:normal;--tw-animation-duration:initial;--tw-animation-fill-mode:none;--tw-animation-iteration-count:1;--tw-enter-blur:0;--tw-enter-opacity:1;--tw-enter-rotate:0;--tw-enter-scale:1;--tw-enter-translate-x:0;--tw-enter-translate-y:0;--tw-exit-blur:0;--tw-exit-opacity:1;--tw-exit-rotate:0;--tw-exit-scale:1;--tw-exit-translate-x:0;--tw-exit-translate-y:0;--scroll-fade-t:0px;--scroll-fade-b:0px;--scroll-fade-s:0px;--scroll-fade-e:0px;--scroll-fade-mask:initial;--shimmer-image:initial;--shimmer-text-fill:initial}}}@layer theme{:root,:host{--font-sans:\"Geist Variable\", ui-sans-serif, system-ui, sans-serif;--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;--color-black:#000;--spacing:.25rem;--container-xs:20rem;--container-sm:24rem;--container-xl:36rem;--container-5xl:64rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height:calc(1.5 / 1);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--font-weight-medium:500;--font-weight-semibold:600;--tracking-tight:-.025em;--tracking-widest:.1em;--leading-snug:1.375;--radius-md:calc(var(--radius) - 2px);--ease-out:cubic-bezier(0, 0, .2, 1);--ease-in-out:cubic-bezier(.4, 0, .2, 1);--animate-spin:spin 1s linear infinite;--blur-xs:4px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:\"Geist Variable\", ui-sans-serif, system-ui, sans-serif;--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", \"Noto Sans\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring:where(:not(iframe)){outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab, red, red)){::placeholder{color:color-mix(in oklab, currentcolor 50%, transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}*{border-color:var(--border);outline-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){*{outline-color:color-mix(in oklab, var(--ring) 50%, transparent)}}body{background-color:var(--background);color:var(--foreground)}html{font-family:Geist Variable,ui-sans-serif,system-ui,sans-serif}}@layer components;@layer utilities{.\\@container\\/card-header{container:card-header/inline-size}.\\@container{container-type:inline-size}.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.invisible{visibility:hidden}.visible{visibility:visible}.sr-only{clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.not-sr-only{clip-path:none;white-space:normal;width:auto;height:auto;margin:0;padding:0;position:static;overflow:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.inset-0{inset:0}.inset-y-0{inset-block:0}.top-1{top:var(--spacing)}.top-1\\/2{top:50%}.top-1\\/3{top:33.3333%}.top-2{top:calc(var(--spacing) * 2)}.right-2{right:calc(var(--spacing) * 2)}.left-0{left:0}.left-1{left:var(--spacing)}.left-1\\/2{left:50%}.isolate{isolation:isolate}.isolation-auto{isolation:auto}.z-10{z-index:10}.z-50{z-index:50}.order-first{order:-9999}.order-last{order:9999}.col-start-2{grid-column-start:2}.row-span-2{grid-row:span 2/span 2}.row-start-1{grid-row-start:1}.container{width:100%}@media (width>=40rem){.container{max-width:40rem}}@media (width>=48rem){.container{max-width:48rem}}@media (width>=64rem){.container{max-width:64rem}}@media (width>=80rem){.container{max-width:80rem}}@media (width>=96rem){.container{max-width:96rem}}.m-0{margin:0}.-mx-1{margin-inline:calc(var(--spacing) * -1)}.-mx-4{margin-inline:calc(var(--spacing) * -4)}.mx-1{margin-inline:var(--spacing)}.mx-auto{margin-inline:auto}.my-1{margin-block:var(--spacing)}.mt-1{margin-top:var(--spacing)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-2{margin-top:calc(var(--spacing) * 2)}.-mb-4{margin-bottom:calc(var(--spacing) * -4)}.mb-1{margin-bottom:var(--spacing)}.mb-1\\.5{margin-bottom:calc(var(--spacing) * 1.5)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.ml-auto{margin-left:auto}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.block{display:block}.contents{display:contents}.flex{display:flex}.flow-root{display:flow-root}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.inline-grid{display:inline-grid}.inline-table{display:inline-table}.list-item{display:list-item}.table{display:table}.table-caption{display:table-caption}.table-cell{display:table-cell}.table-column{display:table-column}.table-column-group{display:table-column-group}.table-footer-group{display:table-footer-group}.table-header-group{display:table-header-group}.table-row{display:table-row}.table-row-group{display:table-row-group}.field-sizing-content{field-sizing:content}.size-4{width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.size-6{width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.size-7{width:calc(var(--spacing) * 7);height:calc(var(--spacing) * 7)}.size-8{width:calc(var(--spacing) * 8);height:calc(var(--spacing) * 8)}.size-9{width:calc(var(--spacing) * 9);height:calc(var(--spacing) * 9)}.size-10{width:calc(var(--spacing) * 10);height:calc(var(--spacing) * 10)}.size-full{width:100%;height:100%}.h-1{height:var(--spacing)}.h-6{height:calc(var(--spacing) * 6)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-8\\!{height:calc(var(--spacing) * 8)!important}.h-9{height:calc(var(--spacing) * 9)}.h-auto{height:auto}.h-px{height:1px}.max-h-\\(--radix-select-content-available-height\\){max-height:var(--radix-select-content-available-height)}.max-h-80{max-height:calc(var(--spacing) * 80)}.min-h-0{min-height:0}.min-h-4{min-height:calc(var(--spacing) * 4)}.min-h-16{min-height:calc(var(--spacing) * 16)}.min-h-32{min-height:calc(var(--spacing) * 32)}.min-h-svh{min-height:100svh}.w-9{width:calc(var(--spacing) * 9)}.w-16{width:calc(var(--spacing) * 16)}.w-80{width:calc(var(--spacing) * 80)}.w-\\[35\\%\\]{width:35%}.w-fit{width:fit-content}.w-full{width:100%}.max-w-5xl{max-width:var(--container-5xl)}.max-w-\\[calc\\(100\\%-2rem\\)\\]{max-width:calc(100% - 2rem)}.max-w-xl{max-width:var(--container-xl)}.min-w-0{min-width:0}.min-w-36{min-width:calc(var(--spacing) * 36)}.flex-1{flex:1}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.grow{flex-grow:1}.border-collapse{border-collapse:collapse}.origin-\\(--radix-select-content-transform-origin\\){transform-origin:var(--radix-select-content-transform-origin)}.-translate-x-1{--tw-translate-x:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-x-1\\/2{--tw-translate-x:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-x-0{--tw-translate-x:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1{--tw-translate-y:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-y-0{--tw-translate-y:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-none{translate:none}.scale-3d{scale:var(--tw-scale-x) var(--tw-scale-y) var(--tw-scale-z)}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.shimmer{--_spread:var(--shimmer-spread,calc(3ch + 40px));--_base:currentColor;--_highlight:var(--shimmer-color,oklch(from currentColor l c h / calc(alpha* .2)));background-image:var(--shimmer-image,linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), var(--_highlight) calc(50% - var(--_spread) * .5), var(--_highlight) 50%, var(--_highlight) calc(50% + var(--_spread) * .5), var(--_base) calc(50% + var(--_spread))))}@supports (color:color-mix(in lab, red, red)){.shimmer{background-image:var(--shimmer-image,linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% - var(--_spread) * .5), var(--_highlight) 50%, color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% + var(--_spread) * .5), var(--_base) calc(50% + var(--_spread))))}}.shimmer{background-repeat:no-repeat;background-size:calc(200% + var(--_spread) * 2) 100%;-webkit-text-fill-color:var(--shimmer-text-fill,transparent);animation:tw-shimmer var(--shimmer-duration,2s) linear infinite;background-position:0 0;-webkit-background-clip:text;background-clip:text}.shimmer:is(.dark *){--_highlight:var(--shimmer-color,oklch(from currentColor max(.8, calc(l + .4)) c h / calc(alpha + .4)))}.shimmer:where([dir=rtl],[dir=rtl] *){animation-direction:reverse}.scroll-fade{--_scroll-fade-size-t:var(--scroll-fade-t-size,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));--_scroll-fade-size-b:var(--scroll-fade-b-size,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));--scroll-fade-block:linear-gradient(to bottom, transparent 0, #000 var(--scroll-fade-t,0px), #000 calc(100% - var(--scroll-fade-b,0px)), transparent 100%);-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-composite:source-in;mask-composite:intersect}@supports (animation-timeline:scroll()){.scroll-fade{animation:1ms ease-in-out scroll-fade-reveal-t,1ms ease-in-out scroll-fade-reveal-b;animation-timeline:scroll(self y),scroll(self y);animation-range:0 var(--scroll-fade-reveal,calc(var(--spacing) * 24)), calc(100% - var(--scroll-fade-reveal,calc(var(--spacing) * 24))) 100%;animation-fill-mode:both}}@supports not (animation-timeline:scroll()){.scroll-fade{--scroll-fade-t:var(--_scroll-fade-size-t);--scroll-fade-b:var(--_scroll-fade-size-b)}}.animate-download-in{animation:.24s cubic-bezier(.16,1,.3,1) both s4e-surface-in}.animate-spin{animation:var(--animate-spin)}.animate-surface-in{animation:.24s cubic-bezier(.16,1,.3,1) s4e-surface-in}.cursor-default{cursor:default}.cursor-text{cursor:text}.touch-pinch-zoom{--tw-pinch-zoom:pinch-zoom;touch-action:var(--tw-pan-x,) var(--tw-pan-y,) var(--tw-pinch-zoom,)}.resize{resize:both}.resize-none{resize:none}.scroll-my-1{scroll-margin-block:var(--spacing)}.scroll-py-1{scroll-padding-block:var(--spacing)}.auto-rows-min{grid-auto-rows:min-content}.grid-rows-\\[auto_1fr\\]{grid-template-rows:auto 1fr}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.flex-wrap{flex-wrap:wrap}.place-items-center{place-items:center}.items-center{align-items:center}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-start{justify-content:flex-start}.gap-\\(--card-spacing\\){gap:var(--card-spacing)}.gap-0{gap:0}.gap-0\\.5{gap:calc(var(--spacing) * .5)}.gap-1{gap:var(--spacing)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-6{gap:calc(var(--spacing) * 6)}:where(.space-y-reverse>:not(:last-child)){--tw-space-y-reverse:1}:where(.space-x-reverse>:not(:last-child)){--tw-space-x-reverse:1}:where(.divide-x>:not(:last-child)){--tw-divide-x-reverse:0;border-inline-style:var(--tw-border-style);border-inline-start-width:calc(1px * var(--tw-divide-x-reverse));border-inline-end-width:calc(1px * calc(1 - var(--tw-divide-x-reverse)))}:where(.divide-y>:not(:last-child)){--tw-divide-y-reverse:0;border-bottom-style:var(--tw-border-style);border-top-style:var(--tw-border-style);border-top-width:calc(1px * var(--tw-divide-y-reverse));border-bottom-width:calc(1px * calc(1 - var(--tw-divide-y-reverse)))}:where(.divide-y-reverse>:not(:last-child)){--tw-divide-y-reverse:1}.self-start{align-self:flex-start}.justify-self-end{justify-self:flex-end}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-x-hidden{overflow-x:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-\\[calc\\(var\\(--radius\\)-3px\\)\\]{border-radius:calc(var(--radius) - 3px)}.rounded-\\[min\\(var\\(--radius-md\\)\\,10px\\)\\]{border-radius:min(var(--radius-md), 10px)}.rounded-\\[min\\(var\\(--radius-md\\)\\,12px\\)\\]{border-radius:min(var(--radius-md), 12px)}.rounded-full{border-radius:2147483647px}.rounded-lg{border-radius:var(--radius)}.rounded-lg\\!{border-radius:var(--radius)!important}.rounded-md{border-radius:calc(var(--radius) - 2px)}.rounded-none{border-radius:0}.rounded-sm{border-radius:calc(var(--radius) - 4px)}.rounded-xl{border-radius:calc(var(--radius) + 4px)}.rounded-xl\\!{border-radius:calc(var(--radius) + 4px)!important}.rounded-s{border-start-start-radius:.25rem;border-end-start-radius:.25rem}.rounded-ss{border-start-start-radius:.25rem}.rounded-e{border-start-end-radius:.25rem;border-end-end-radius:.25rem}.rounded-se{border-start-end-radius:.25rem}.rounded-ee{border-end-end-radius:.25rem}.rounded-es{border-end-start-radius:.25rem}.rounded-t{border-top-left-radius:.25rem;border-top-right-radius:.25rem}.rounded-t-xl{border-top-left-radius:calc(var(--radius) + 4px);border-top-right-radius:calc(var(--radius) + 4px)}.rounded-l{border-top-left-radius:.25rem;border-bottom-left-radius:.25rem}.rounded-tl{border-top-left-radius:.25rem}.rounded-r{border-top-right-radius:.25rem;border-bottom-right-radius:.25rem}.rounded-tr{border-top-right-radius:.25rem}.rounded-b{border-bottom-right-radius:.25rem;border-bottom-left-radius:.25rem}.rounded-b-xl{border-bottom-right-radius:calc(var(--radius) + 4px);border-bottom-left-radius:calc(var(--radius) + 4px)}.rounded-br{border-bottom-right-radius:.25rem}.rounded-bl{border-bottom-left-radius:.25rem}.border{border-style:var(--tw-border-style);border-width:1px}.border-0{border-style:var(--tw-border-style);border-width:0}.border-x{border-inline-style:var(--tw-border-style);border-inline-width:1px}.border-y{border-block-style:var(--tw-border-style);border-block-width:1px}.border-s{border-inline-start-style:var(--tw-border-style);border-inline-start-width:1px}.border-e{border-inline-end-style:var(--tw-border-style);border-inline-end-width:1px}.border-bs{border-block-start-style:var(--tw-border-style);border-block-start-width:1px}.border-be{border-block-end-style:var(--tw-border-style);border-block-end-width:1px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-r{border-right-style:var(--tw-border-style);border-right-width:1px}.border-b{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-l{border-left-style:var(--tw-border-style);border-left-width:1px}.border-border{border-color:var(--border)}.border-input,.border-input\\/30{border-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.border-input\\/30{border-color:color-mix(in oklab, var(--input) 30%, transparent)}}.border-transparent{border-color:#0000}.bg-background{background-color:var(--background)}.bg-black{background-color:var(--color-black)}.bg-black\\/10{background-color:#0000001a}@supports (color:color-mix(in lab, red, red)){.bg-black\\/10{background-color:color-mix(in oklab, var(--color-black) 10%, transparent)}}.bg-border{background-color:var(--border)}.bg-card{background-color:var(--card)}.bg-destructive,.bg-destructive\\/10{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.bg-destructive\\/10{background-color:color-mix(in oklab, var(--destructive) 10%, transparent)}}.bg-input,.bg-input\\/30{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.bg-input\\/30{background-color:color-mix(in oklab, var(--input) 30%, transparent)}}.bg-muted,.bg-muted\\/50{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.bg-muted\\/50{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}.bg-popover{background-color:var(--popover)}.bg-primary{background-color:var(--primary)}.bg-secondary{background-color:var(--secondary)}.bg-transparent{background-color:#0000}.bg-clip-padding{background-clip:padding-box}.bg-repeat{background-repeat:repeat}.mask-no-clip{-webkit-mask-clip:no-clip;mask-clip:no-clip}.mask-repeat{-webkit-mask-repeat:repeat;mask-repeat:repeat}.p-\\(--card-spacing\\){padding:var(--card-spacing)}.p-0{padding:0}.p-1{padding:var(--spacing)}.p-4{padding:calc(var(--spacing) * 4)}.px-\\(--card-spacing\\){padding-inline:var(--card-spacing)}.px-1{padding-inline:var(--spacing)}.px-1\\.5{padding-inline:calc(var(--spacing) * 1.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-6{padding-inline:calc(var(--spacing) * 6)}.py-\\(--card-spacing\\){padding-block:var(--card-spacing)}.py-1{padding-block:var(--spacing)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-2\\.5{padding-block:calc(var(--spacing) * 2.5)}.py-3{padding-block:calc(var(--spacing) * 3)}.py-6{padding-block:calc(var(--spacing) * 6)}.py-10{padding-block:calc(var(--spacing) * 10)}.pt-2{padding-top:calc(var(--spacing) * 2)}.pr-2{padding-right:calc(var(--spacing) * 2)}.pr-8{padding-right:calc(var(--spacing) * 8)}.pb-0{padding-bottom:0}.pb-1{padding-bottom:var(--spacing)}.pb-2{padding-bottom:calc(var(--spacing) * 2)}.pb-2\\.5{padding-bottom:calc(var(--spacing) * 2.5)}.pb-6{padding-bottom:calc(var(--spacing) * 6)}.pl-1{padding-left:var(--spacing)}.pl-1\\.5{padding-left:calc(var(--spacing) * 1.5)}.pl-2{padding-left:calc(var(--spacing) * 2)}.pl-2\\.5{padding-left:calc(var(--spacing) * 2.5)}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.font-heading{font-family:var(--font-sans)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[0\\.8rem\\]{font-size:.8rem}.leading-none{--tw-leading:1;line-height:1}.leading-snug{--tw-leading:var(--leading-snug);line-height:var(--leading-snug)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.tracking-widest{--tw-tracking:var(--tracking-widest);letter-spacing:var(--tracking-widest)}.text-balance{text-wrap:balance}.text-wrap{text-wrap:wrap}.break-all{word-break:break-all}.text-clip{text-overflow:clip}.text-ellipsis{text-overflow:ellipsis}.whitespace-nowrap{white-space:nowrap}.text-card-foreground{color:var(--card-foreground)}.text-destructive{color:var(--destructive)}.text-foreground{color:var(--foreground)}.text-muted-foreground,.text-muted-foreground\\/50{color:var(--muted-foreground)}@supports (color:color-mix(in lab, red, red)){.text-muted-foreground\\/50{color:color-mix(in oklab, var(--muted-foreground) 50%, transparent)}}.text-popover-foreground{color:var(--popover-foreground)}.text-primary{color:var(--primary)}.text-primary-foreground{color:var(--primary-foreground)}.text-secondary-foreground{color:var(--secondary-foreground)}.text-warning{color:var(--warning)}.capitalize{text-transform:capitalize}.lowercase{text-transform:lowercase}.normal-case{text-transform:none}.uppercase{text-transform:uppercase}.italic{font-style:italic}.not-italic{font-style:normal}.diagonal-fractions{--tw-numeric-fraction:diagonal-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.lining-nums{--tw-numeric-figure:lining-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.oldstyle-nums{--tw-numeric-figure:oldstyle-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.ordinal{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.proportional-nums{--tw-numeric-spacing:proportional-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.slashed-zero{--tw-slashed-zero:slashed-zero;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.stacked-fractions{--tw-numeric-fraction:stacked-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.tabular-nums{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.normal-nums{font-variant-numeric:normal}.line-through{text-decoration-line:line-through}.no-underline{text-decoration-line:none}.overline{text-decoration-line:overline}.underline{text-decoration-line:underline}.underline-offset-4{text-underline-offset:4px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.subpixel-antialiased{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}.opacity-0{opacity:0}.opacity-50{opacity:.5}.opacity-60{opacity:.6}.opacity-100{opacity:1}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px var(--tw-shadow-color,#0000001a), 0 2px 4px -2px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-none{--tw-shadow:0 0 #0000;box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-none\\!{--tw-shadow:0 0 #0000!important;box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)!important}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-0{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-1{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.inset-ring{--tw-inset-ring-shadow:inset 0 0 0 1px var(--tw-inset-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-foreground,.ring-foreground\\/10{--tw-ring-color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.ring-foreground\\/10{--tw-ring-color:color-mix(in oklab, var(--foreground) 10%, transparent)}}.outline-hidden{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.outline-hidden{outline-offset:2px;outline:2px solid #0000}}.outline{outline-style:var(--tw-outline-style);outline-width:1px}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.drop-shadow{--tw-drop-shadow-size:drop-shadow(0 1px 2px var(--tw-drop-shadow-color,#0000001a)) drop-shadow(0 1px 1px var(--tw-drop-shadow-color,#0000000f));--tw-drop-shadow:drop-shadow(0 1px 2px #0000001a) drop-shadow(0 1px 1px #0000000f);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.grayscale{--tw-grayscale:grayscale(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.sepia{--tw-sepia:sepia(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur{--tw-backdrop-blur:blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-grayscale{--tw-backdrop-grayscale:grayscale(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-invert{--tw-backdrop-invert:invert(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-sepia{--tw-backdrop-sepia:sepia(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-100{--tw-duration:.1s;transition-duration:.1s}.duration-150{--tw-duration:.15s;transition-duration:.15s}.duration-300{--tw-duration:.3s;transition-duration:.3s}.duration-500{--tw-duration:.5s;transition-duration:.5s}.ease-in-out{--tw-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.ease-out-expo{--tw-ease:cubic-bezier(.16, 1, .3, 1);transition-timing-function:cubic-bezier(.16,1,.3,1)}.outline-none{--tw-outline-style:none;outline-style:none}.select-none{-webkit-user-select:none;user-select:none}.\\[--card-spacing\\:--spacing\\(4\\)\\]{--card-spacing:calc(var(--spacing) * 4)}:where(.divide-x-reverse>:not(:last-child)){--tw-divide-x-reverse:1}.paused{animation-play-state:paused}.ring-inset{--tw-ring-inset:inset}.running{animation-play-state:running}.zoom-in{--tw-enter-scale:0}.zoom-out{--tw-exit-scale:0}.group-has-data-\\[slot\\=command-shortcut\\]\\/command-item\\:hidden:is(:where(.group\\/command-item):has([data-slot=command-shortcut]) *){display:none}.group-has-\\[\\>input\\]\\/input-group\\:pt-2:is(:where(.group\\/input-group):has(>input) *){padding-top:calc(var(--spacing) * 2)}.group-has-\\[\\>input\\]\\/input-group\\:pb-2:is(:where(.group\\/input-group):has(>input) *){padding-bottom:calc(var(--spacing) * 2)}.group-has-\\[\\>svg\\]\\/alert\\:col-start-2:is(:where(.group\\/alert):has(>svg) *){grid-column-start:2}.group-data-\\[checked\\=true\\]\\/command-item\\:opacity-100:is(:where(.group\\/command-item)[data-checked=true] *){opacity:1}.group-data-\\[disabled\\=true\\]\\:pointer-events-none:is(:where(.group)[data-disabled=true] *){pointer-events:none}.group-data-\\[disabled\\=true\\]\\:opacity-50:is(:where(.group)[data-disabled=true] *),.group-data-\\[disabled\\=true\\]\\/input-group\\:opacity-50:is(:where(.group\\/input-group)[data-disabled=true] *){opacity:.5}.group-data-\\[size\\=default\\]\\/switch\\:size-4:is(:where(.group\\/switch)[data-size=default] *){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.group-data-\\[size\\=sm\\]\\/alert-dialog-content\\:grid:is(:where(.group\\/alert-dialog-content)[data-size=sm] *){display:grid}.group-data-\\[size\\=sm\\]\\/alert-dialog-content\\:grid-cols-2:is(:where(.group\\/alert-dialog-content)[data-size=sm] *){grid-template-columns:repeat(2,minmax(0,1fr))}.group-data-\\[size\\=sm\\]\\/card\\:text-sm:is(:where(.group\\/card)[data-size=sm] *){font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.group-data-\\[size\\=sm\\]\\/switch\\:size-3:is(:where(.group\\/switch)[data-size=sm] *){width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.group-data-selected\\/command-item\\:text-foreground:is(:where(.group\\/command-item):where([data-selected=true]) *){color:var(--foreground)}.peer-disabled\\:cursor-not-allowed:is(:where(.peer):disabled~*){cursor:not-allowed}.peer-disabled\\:opacity-50:is(:where(.peer):disabled~*){opacity:.5}.file\\:inline-flex::file-selector-button{display:inline-flex}.file\\:h-6::file-selector-button{height:calc(var(--spacing) * 6)}.file\\:border-0::file-selector-button{border-style:var(--tw-border-style);border-width:0}.file\\:bg-transparent::file-selector-button{background-color:#0000}.file\\:text-sm::file-selector-button{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.file\\:font-medium::file-selector-button{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.file\\:text-foreground::file-selector-button{color:var(--foreground)}.placeholder\\:text-muted-foreground::placeholder{color:var(--muted-foreground)}.after\\:absolute:after{content:var(--tw-content);position:absolute}.after\\:-inset-x-3:after{content:var(--tw-content);inset-inline:calc(var(--spacing) * -3)}.after\\:-inset-y-2:after{content:var(--tw-content);inset-block:calc(var(--spacing) * -2)}@media (hover:hover){.hover\\:bg-\\[color-mix\\(in_oklch\\,var\\(--secondary\\)\\,var\\(--foreground\\)_5\\%\\)\\]:hover{background-color:var(--secondary)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-\\[color-mix\\(in_oklch\\,var\\(--secondary\\)\\,var\\(--foreground\\)_5\\%\\)\\]:hover{background-color:color-mix(in oklch,var(--secondary),var(--foreground) 5%)}}.hover\\:bg-destructive\\/20:hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-destructive\\/20:hover{background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.hover\\:bg-muted:hover{background-color:var(--muted)}.hover\\:bg-primary\\/80:hover{background-color:var(--primary)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-primary\\/80:hover{background-color:color-mix(in oklab, var(--primary) 80%, transparent)}}.hover\\:text-foreground:hover{color:var(--foreground)}.hover\\:underline:hover{text-decoration-line:underline}}.focus\\:bg-accent:focus{background-color:var(--accent)}.focus\\:text-accent-foreground:focus,:is(.not-data-\\[variant\\=destructive\\]\\:focus\\:\\*\\*\\:text-accent-foreground:not([data-variant=destructive]):focus *){color:var(--accent-foreground)}.focus-visible\\:border-destructive\\/40:focus-visible{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:border-destructive\\/40:focus-visible{border-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.focus-visible\\:border-ring:focus-visible{border-color:var(--ring)}.focus-visible\\:ring-0:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-3:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-destructive\\/20:focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-destructive\\/20:focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.focus-visible\\:ring-ring\\/50:focus-visible{--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-ring\\/50:focus-visible{--tw-ring-color:color-mix(in oklab, var(--ring) 50%, transparent)}}.active\\:not-aria-\\[haspopup\\]\\:translate-y-0:active:not([aria-haspopup]){--tw-translate-y:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.active\\:not-aria-\\[haspopup\\]\\:translate-y-px:active:not([aria-haspopup]){--tw-translate-y:1px;translate:var(--tw-translate-x) var(--tw-translate-y)}.disabled\\:pointer-events-none:disabled{pointer-events:none}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:bg-input\\/50:disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.disabled\\:bg-input\\/50:disabled{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.disabled\\:bg-transparent:disabled{background-color:#0000}.disabled\\:opacity-50:disabled{opacity:.5}:where([data-slot=button-group]) .in-data-\\[slot\\=button-group\\]\\:rounded-lg{border-radius:var(--radius)}:where([data-slot=combobox-content]) .in-data-\\[slot\\=combobox-content\\]\\:focus-within\\:border-inherit:focus-within{border-color:inherit}:where([data-slot=combobox-content]) .in-data-\\[slot\\=combobox-content\\]\\:focus-within\\:ring-0:focus-within{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}:where([data-slot=dialog-content]) .in-data-\\[slot\\=dialog-content\\]\\:rounded-lg\\!{border-radius:var(--radius)!important}.has-disabled\\:bg-input\\/50:has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.has-disabled\\:bg-input\\/50:has(:disabled){background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.has-disabled\\:opacity-50:has(:disabled){opacity:.5}.has-data-\\[icon\\=inline-end\\]\\:pr-1\\.5:has([data-icon=inline-end]){padding-right:calc(var(--spacing) * 1.5)}.has-data-\\[icon\\=inline-end\\]\\:pr-2:has([data-icon=inline-end]){padding-right:calc(var(--spacing) * 2)}.has-data-\\[icon\\=inline-start\\]\\:pl-1\\.5:has([data-icon=inline-start]){padding-left:calc(var(--spacing) * 1.5)}.has-data-\\[icon\\=inline-start\\]\\:pl-2:has([data-icon=inline-start]){padding-left:calc(var(--spacing) * 2)}.has-data-\\[slot\\=alert-action\\]\\:relative:has([data-slot=alert-action]){position:relative}.has-data-\\[slot\\=alert-action\\]\\:pr-18:has([data-slot=alert-action]){padding-right:calc(var(--spacing) * 18)}.has-data-\\[slot\\=alert-dialog-media\\]\\:grid-rows-\\[auto_auto_1fr\\]:has([data-slot=alert-dialog-media]){grid-template-rows:auto auto 1fr}.has-data-\\[slot\\=alert-dialog-media\\]\\:gap-x-4:has([data-slot=alert-dialog-media]){column-gap:calc(var(--spacing) * 4)}.has-data-\\[slot\\=card-action\\]\\:grid-cols-\\[1fr_auto\\]:has([data-slot=card-action]){grid-template-columns:1fr auto}.has-data-\\[slot\\=card-description\\]\\:grid-rows-\\[auto_auto\\]:has([data-slot=card-description]){grid-template-rows:auto auto}.has-data-\\[slot\\=card-footer\\]\\:pb-0:has([data-slot=card-footer]){padding-bottom:0}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:border-ring:has([data-slot=input-group-control]:focus-visible){border-color:var(--ring)}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-3:has([data-slot=input-group-control]:focus-visible){--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-ring\\/50:has([data-slot=input-group-control]:focus-visible){--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-ring\\/50:has([data-slot=input-group-control]:focus-visible){--tw-ring-color:color-mix(in oklab, var(--ring) 50%, transparent)}}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:border-destructive:has([data-slot][aria-invalid=true]){border-color:var(--destructive)}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-3:has([data-slot][aria-invalid=true]){--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/20:has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/20:has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:h-auto:has(>[data-align=block-end]){height:auto}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:flex-col:has(>[data-align=block-end]){flex-direction:column}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:h-auto:has(>[data-align=block-start]){height:auto}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:flex-col:has(>[data-align=block-start]){flex-direction:column}.has-\\[\\>button\\]\\:mr-\\[-0\\.3rem\\]:has(>button){margin-right:-.3rem}.has-\\[\\>button\\]\\:ml-\\[-0\\.3rem\\]:has(>button){margin-left:-.3rem}.has-\\[\\>img\\:first-child\\]\\:pt-0:has(>img:first-child){padding-top:0}.has-\\[\\>kbd\\]\\:mr-\\[-0\\.15rem\\]:has(>kbd){margin-right:-.15rem}.has-\\[\\>kbd\\]\\:ml-\\[-0\\.15rem\\]:has(>kbd){margin-left:-.15rem}.has-\\[\\>svg\\]\\:grid-cols-\\[auto_1fr\\]:has(>svg){grid-template-columns:auto 1fr}.has-\\[\\>svg\\]\\:gap-x-2:has(>svg){column-gap:calc(var(--spacing) * 2)}.has-\\[\\>svg\\]\\:p-0:has(>svg){padding:0}.has-\\[\\>textarea\\]\\:h-auto:has(>textarea){height:auto}.aria-expanded\\:bg-muted[aria-expanded=true]{background-color:var(--muted)}.aria-expanded\\:bg-secondary[aria-expanded=true]{background-color:var(--secondary)}.aria-expanded\\:text-foreground[aria-expanded=true]{color:var(--foreground)}.aria-expanded\\:text-secondary-foreground[aria-expanded=true]{color:var(--secondary-foreground)}.aria-invalid\\:border-destructive[aria-invalid=true]{border-color:var(--destructive)}.aria-invalid\\:ring-0[aria-invalid=true]{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.aria-invalid\\:ring-3[aria-invalid=true]{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.aria-invalid\\:ring-destructive\\/20[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.aria-invalid\\:ring-destructive\\/20[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.data-placeholder\\:text-muted-foreground[data-placeholder]{color:var(--muted-foreground)}.data-\\[align-trigger\\=true\\]\\:animate-none[data-align-trigger=true]{animation:none}.data-\\[disabled\\=true\\]\\:pointer-events-none[data-disabled=true]{pointer-events:none}.data-\\[disabled\\=true\\]\\:opacity-50[data-disabled=true]{opacity:.5}.data-\\[position\\=popper\\]\\:h-\\(--radix-select-trigger-height\\)[data-position=popper]{height:var(--radix-select-trigger-height)}.data-\\[position\\=popper\\]\\:w-full[data-position=popper]{width:100%}.data-\\[position\\=popper\\]\\:min-w-\\(--radix-select-trigger-width\\)[data-position=popper]{min-width:var(--radix-select-trigger-width)}.data-\\[side\\=bottom\\]\\:translate-y-1[data-side=bottom]{--tw-translate-y:var(--spacing);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=bottom\\]\\:slide-in-from-top-2[data-side=bottom]{--tw-enter-translate-y:calc(2*var(--spacing)*-1)}.data-\\[side\\=left\\]\\:-translate-x-1[data-side=left]{--tw-translate-x:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=left\\]\\:slide-in-from-right-2[data-side=left]{--tw-enter-translate-x:calc(2*var(--spacing))}.data-\\[side\\=right\\]\\:translate-x-1[data-side=right]{--tw-translate-x:var(--spacing);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=right\\]\\:slide-in-from-left-2[data-side=right]{--tw-enter-translate-x:calc(2*var(--spacing)*-1)}.data-\\[side\\=top\\]\\:-translate-y-1[data-side=top]{--tw-translate-y:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=top\\]\\:slide-in-from-bottom-2[data-side=top]{--tw-enter-translate-y:calc(2*var(--spacing))}.data-\\[size\\=default\\]\\:h-8[data-size=default]{height:calc(var(--spacing) * 8)}.data-\\[size\\=default\\]\\:h-\\[18\\.4px\\][data-size=default]{height:18.4px}.data-\\[size\\=default\\]\\:w-\\[32px\\][data-size=default]{width:32px}.data-\\[size\\=default\\]\\:max-w-xs[data-size=default]{max-width:var(--container-xs)}.data-\\[size\\=sm\\]\\:h-7[data-size=sm]{height:calc(var(--spacing) * 7)}.data-\\[size\\=sm\\]\\:h-\\[14px\\][data-size=sm]{height:14px}.data-\\[size\\=sm\\]\\:w-\\[24px\\][data-size=sm]{width:24px}.data-\\[size\\=sm\\]\\:max-w-xs[data-size=sm]{max-width:var(--container-xs)}.data-\\[size\\=sm\\]\\:rounded-\\[min\\(var\\(--radius-md\\)\\,10px\\)\\][data-size=sm]{border-radius:min(var(--radius-md), 10px)}.data-\\[size\\=sm\\]\\:\\[--card-spacing\\:--spacing\\(3\\)\\][data-size=sm]{--card-spacing:calc(var(--spacing) * 3)}.data-\\[size\\=sm\\]\\:has-data-\\[slot\\=card-footer\\]\\:pb-0[data-size=sm]:has([data-slot=card-footer]){padding-bottom:0}:is(.\\*\\:data-\\[slot\\=alert-description\\]\\:text-destructive\\/90>*)[data-slot=alert-description]{color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:is(.\\*\\:data-\\[slot\\=alert-description\\]\\:text-destructive\\/90>*)[data-slot=alert-description]{color:color-mix(in oklab, var(--destructive) 90%, transparent)}}:is(.\\*\\:data-\\[slot\\=input-group-addon\\]\\:pl-2\\!>*)[data-slot=input-group-addon]{padding-left:calc(var(--spacing) * 2)!important}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:line-clamp-1>*)[data-slot=select-value]{-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:flex>*)[data-slot=select-value]{display:flex}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:items-center>*)[data-slot=select-value]{align-items:center}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:gap-1\\.5>*)[data-slot=select-value]{gap:calc(var(--spacing) * 1.5)}@supports ((-webkit-backdrop-filter:var(--tw)) or (backdrop-filter:var(--tw))){.supports-backdrop-filter\\:backdrop-blur-xs{--tw-backdrop-blur:blur(var(--blur-xs));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}}@media (prefers-reduced-motion:reduce){.motion-reduce\\:hidden{display:none}.motion-reduce\\:animate-none\\!{animation:none!important}.motion-reduce\\:transition-none{transition-property:none}}@media (width>=40rem){.sm\\:max-w-sm{max-width:var(--container-sm)}.sm\\:flex-row{flex-direction:row}.sm\\:items-end{align-items:flex-end}.sm\\:justify-between{justify-content:space-between}.sm\\:justify-end{justify-content:flex-end}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:row-span-2:is(:where(.group\\/alert-dialog-content)[data-size=default] *){grid-row:span 2/span 2}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:place-items-start:is(:where(.group\\/alert-dialog-content)[data-size=default] *){place-items:start}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:text-left:is(:where(.group\\/alert-dialog-content)[data-size=default] *){text-align:left}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:group-has-data-\\[slot\\=alert-dialog-media\\]\\/alert-dialog-content\\:col-start-2:is(:where(.group\\/alert-dialog-content)[data-size=default] *):is(:where(.group\\/alert-dialog-content):has([data-slot=alert-dialog-media]) *){grid-column-start:2}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:has-data-\\[slot\\=alert-dialog-media\\]\\:grid-rows-\\[auto_1fr\\]:is(:where(.group\\/alert-dialog-content)[data-size=default] *):has([data-slot=alert-dialog-media]){grid-template-rows:auto 1fr}.data-\\[size\\=default\\]\\:sm\\:max-w-sm[data-size=default]{max-width:var(--container-sm)}}@media (width>=48rem){.md\\:text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.md\\:text-pretty{text-wrap:pretty}}@media (width>=64rem){.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}.dark\\:border-input:is(.dark *){border-color:var(--input)}.dark\\:bg-destructive\\/20:is(.dark *){background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-destructive\\/20:is(.dark *){background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.dark\\:bg-input\\/30:is(.dark *){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-input\\/30:is(.dark *){background-color:color-mix(in oklab, var(--input) 30%, transparent)}}.dark\\:bg-transparent:is(.dark *){background-color:#0000}@media (hover:hover){.dark\\:hover\\:bg-destructive\\/30:is(.dark *):hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-destructive\\/30:is(.dark *):hover{background-color:color-mix(in oklab, var(--destructive) 30%, transparent)}}.dark\\:hover\\:bg-input\\/50:is(.dark *):hover{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-input\\/50:is(.dark *):hover{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.dark\\:hover\\:bg-muted\\/50:is(.dark *):hover{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-muted\\/50:is(.dark *):hover{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}}.dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.dark\\:disabled\\:bg-input\\/80:is(.dark *):disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:disabled\\:bg-input\\/80:is(.dark *):disabled{background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.dark\\:disabled\\:bg-transparent:is(.dark *):disabled{background-color:#0000}.dark\\:has-disabled\\:bg-input\\/80:is(.dark *):has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:has-disabled\\:bg-input\\/80:is(.dark *):has(:disabled){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:is(.dark *):has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:is(.dark *):has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.dark\\:aria-invalid\\:border-destructive\\/50:is(.dark *)[aria-invalid=true]{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:aria-invalid\\:border-destructive\\/50:is(.dark *)[aria-invalid=true]{border-color:color-mix(in oklab, var(--destructive) 50%, transparent)}}.dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.data-open\\:animate-dialog-in:where([data-state=open]),.data-open\\:animate-dialog-in:where([data-open]:not([data-open=false])){animation:.32s cubic-bezier(.16,1,.3,1) s4e-dialog-in}.data-open\\:animate-in:where([data-state=open]),.data-open\\:animate-in:where([data-open]:not([data-open=false])){animation:enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.data-open\\:animate-overlay-in:where([data-state=open]),.data-open\\:animate-overlay-in:where([data-open]:not([data-open=false])){animation:.32s cubic-bezier(.16,1,.3,1) s4e-overlay-in}.data-open\\:fade-in-0:where([data-state=open]),.data-open\\:fade-in-0:where([data-open]:not([data-open=false])){--tw-enter-opacity:0}.data-open\\:zoom-in-95:where([data-state=open]),.data-open\\:zoom-in-95:where([data-open]:not([data-open=false])){--tw-enter-scale:.95}.data-closed\\:animate-dialog-out:where([data-state=closed]),.data-closed\\:animate-dialog-out:where([data-closed]:not([data-closed=false])){animation:.18s cubic-bezier(.4,0,1,1) forwards s4e-dialog-out}.data-closed\\:animate-out:where([data-state=closed]),.data-closed\\:animate-out:where([data-closed]:not([data-closed=false])){animation:exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.data-closed\\:animate-overlay-out:where([data-state=closed]),.data-closed\\:animate-overlay-out:where([data-closed]:not([data-closed=false])){animation:.18s cubic-bezier(.4,0,1,1) forwards s4e-overlay-out}.data-closed\\:fade-out-0:where([data-state=closed]),.data-closed\\:fade-out-0:where([data-closed]:not([data-closed=false])){--tw-exit-opacity:0}.data-closed\\:zoom-out-95:where([data-state=closed]),.data-closed\\:zoom-out-95:where([data-closed]:not([data-closed=false])){--tw-exit-scale:.95}.data-checked\\:bg-primary:where([data-state=checked]),.data-checked\\:bg-primary:where([data-checked]:not([data-checked=false])){background-color:var(--primary)}.group-data-\\[size\\=default\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=default] *):where([data-state=checked]),.group-data-\\[size\\=default\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=default] *):where([data-checked]:not([data-checked=false])),.group-data-\\[size\\=sm\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=sm] *):where([data-state=checked]),.group-data-\\[size\\=sm\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=sm] *):where([data-checked]:not([data-checked=false])){--tw-translate-x:calc(100% - 2px);translate:var(--tw-translate-x) var(--tw-translate-y)}.dark\\:data-checked\\:bg-primary-foreground:is(.dark *):where([data-state=checked]),.dark\\:data-checked\\:bg-primary-foreground:is(.dark *):where([data-checked]:not([data-checked=false])){background-color:var(--primary-foreground)}.data-unchecked\\:bg-input:where([data-state=unchecked]),.data-unchecked\\:bg-input:where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}.group-data-\\[size\\=default\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=default] *):where([data-state=unchecked]),.group-data-\\[size\\=default\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=default] *):where([data-unchecked]:not([data-unchecked=false])),.group-data-\\[size\\=sm\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=sm] *):where([data-state=unchecked]),.group-data-\\[size\\=sm\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=sm] *):where([data-unchecked]:not([data-unchecked=false])){--tw-translate-x:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.dark\\:data-unchecked\\:bg-foreground:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-foreground:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:var(--foreground)}.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.data-selected\\:bg-muted:where([data-selected=true]){background-color:var(--muted)}.data-selected\\:text-foreground:where([data-selected=true]){color:var(--foreground)}.data-disabled\\:pointer-events-none:where([data-disabled=true]),.data-disabled\\:pointer-events-none:where([data-disabled]:not([data-disabled=false])){pointer-events:none}.data-disabled\\:cursor-not-allowed:where([data-disabled=true]),.data-disabled\\:cursor-not-allowed:where([data-disabled]:not([data-disabled=false])){cursor:not-allowed}.data-disabled\\:opacity-50:where([data-disabled=true]),.data-disabled\\:opacity-50:where([data-disabled]:not([data-disabled=false])){opacity:.5}.data-horizontal\\:h-px:where([data-orientation=horizontal]){height:1px}.data-horizontal\\:w-full:where([data-orientation=horizontal]){width:100%}.data-vertical\\:w-px:where([data-orientation=vertical]){width:1px}.data-vertical\\:self-stretch:where([data-orientation=vertical]){align-self:stretch}.\\[\\&_a\\]\\:underline a{text-decoration-line:underline}.\\[\\&_a\\]\\:underline-offset-3 a{text-underline-offset:3px}@media (hover:hover){.\\[\\&_a\\]\\:hover\\:text-foreground a:hover{color:var(--foreground)}}.\\[\\&_p\\:not\\(\\:last-child\\)\\]\\:mb-4 p:not(:last-child){margin-bottom:calc(var(--spacing) * 4)}.\\[\\&_svg\\]\\:pointer-events-none svg{pointer-events:none}.\\[\\&_svg\\]\\:shrink-0 svg{flex-shrink:0}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3 svg:not([class*=size-]){width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3\\.5 svg:not([class*=size-]){width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4 svg:not([class*=size-]){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.\\[\\.border-b\\]\\:pb-\\(--card-spacing\\).border-b{padding-bottom:var(--card-spacing)}.\\[\\.border-b\\]\\:pb-2.border-b{padding-bottom:calc(var(--spacing) * 2)}.\\[\\.border-t\\]\\:pt-2.border-t{padding-top:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:px-2 *)[cmdk-group-heading]{padding-inline:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:py-1\\.5 *)[cmdk-group-heading]{padding-block:calc(var(--spacing) * 1.5)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:text-xs *)[cmdk-group-heading]{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:font-medium *)[cmdk-group-heading]{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:text-muted-foreground *)[cmdk-group-heading]{color:var(--muted-foreground)}:is(.\\*\\:\\[a\\]\\:underline>*):is(a){text-decoration-line:underline}:is(.\\*\\:\\[a\\]\\:underline-offset-3>*):is(a){text-underline-offset:3px}@media (hover:hover){:is(.\\*\\:\\[a\\]\\:hover\\:text-foreground>*):is(a):hover{color:var(--foreground)}}:is(.\\*\\:\\[img\\:first-child\\]\\:rounded-t-xl>*):is(img:first-child){border-top-left-radius:calc(var(--radius) + 4px);border-top-right-radius:calc(var(--radius) + 4px)}:is(.\\*\\:\\[img\\:last-child\\]\\:rounded-b-xl>*):is(img:last-child){border-bottom-right-radius:calc(var(--radius) + 4px);border-bottom-left-radius:calc(var(--radius) + 4px)}:is(.\\*\\:\\[span\\]\\:last\\:flex>*):is(span):last-child{display:flex}:is(.\\*\\:\\[span\\]\\:last\\:items-center>*):is(span):last-child{align-items:center}:is(.\\*\\:\\[span\\]\\:last\\:gap-2>*):is(span):last-child{gap:calc(var(--spacing) * 2)}:is(.\\*\\:\\[svg\\]\\:row-span-2>*):is(svg){grid-row:span 2/span 2}:is(.\\*\\:\\[svg\\]\\:translate-y-0\\.5>*):is(svg){--tw-translate-y:calc(var(--spacing) * .5);translate:var(--tw-translate-x) var(--tw-translate-y)}:is(.\\*\\:\\[svg\\]\\:text-current>*):is(svg){color:currentColor}:is(.data-selected\\:\\*\\:\\[svg\\]\\:text-foreground:where([data-selected=true])>*):is(svg){color:var(--foreground)}:is(.\\*\\:\\[svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4>*):is(svg:not([class*=size-])){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}:is(.\\*\\:\\[svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-6>*):is(svg:not([class*=size-])){width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:\\[\\&\\>input\\]\\:pt-3:has(>[data-align=block-end])>input{padding-top:calc(var(--spacing) * 3)}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:\\[\\&\\>input\\]\\:pb-3:has(>[data-align=block-start])>input{padding-bottom:calc(var(--spacing) * 3)}.has-\\[\\>\\[data-align\\=inline-end\\]\\]\\:\\[\\&\\>input\\]\\:pr-1\\.5:has(>[data-align=inline-end])>input{padding-right:calc(var(--spacing) * 1.5)}.has-\\[\\>\\[data-align\\=inline-start\\]\\]\\:\\[\\&\\>input\\]\\:pl-1\\.5:has(>[data-align=inline-start])>input{padding-left:calc(var(--spacing) * 1.5)}.\\[\\&\\>kbd\\]\\:rounded-\\[calc\\(var\\(--radius\\)-5px\\)\\]>kbd{border-radius:calc(var(--radius) - 5px)}.\\[\\&\\>svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3\\.5>svg:not([class*=size-]){width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.\\[\\&\\>svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4>svg:not([class*=size-]){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}}@property --tw-animation-delay{syntax:\"*\";inherits:false;initial-value:0s}@property --tw-animation-direction{syntax:\"*\";inherits:false;initial-value:normal}@property --tw-animation-duration{syntax:\"*\";inherits:false}@property --tw-animation-fill-mode{syntax:\"*\";inherits:false;initial-value:none}@property --tw-animation-iteration-count{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --scroll-fade-t{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-b{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-s{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-e{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-mask{syntax:\"*\";inherits:false}@property --shimmer-angle{syntax:\"<angle>\";inherits:true;initial-value:20deg}@property --shimmer-image{syntax:\"*\";inherits:false}@property --shimmer-text-fill{syntax:\"*\";inherits:false}@media (prefers-reduced-motion:reduce){.shimmer{-webkit-text-fill-color:currentColor;background-image:none;animation:none}}:root,:host,.palette-scope{--background:oklch(100% 0 0);--foreground:oklch(14.5% 0 0);--card:oklch(100% 0 0);--card-foreground:oklch(14.5% 0 0);--popover:oklch(100% 0 0);--popover-foreground:oklch(14.5% 0 0);--primary:oklch(20.5% 0 0);--primary-foreground:oklch(98.5% 0 0);--secondary:oklch(97% 0 0);--secondary-foreground:oklch(20.5% 0 0);--muted:oklch(97% 0 0);--muted-foreground:oklch(55.6% 0 0);--accent:oklch(97% 0 0);--accent-foreground:oklch(20.5% 0 0);--destructive:oklch(57.7% .245 27.325);--warning:oklch(55.5% .163 48.998);--border:oklch(92.2% 0 0);--input:oklch(92.2% 0 0);--ring:oklch(70.8% 0 0);--chart-1:oklch(87% 0 0);--chart-2:oklch(55.6% 0 0);--chart-3:oklch(43.9% 0 0);--chart-4:oklch(37.1% 0 0);--chart-5:oklch(26.9% 0 0);--radius:.625rem;--sidebar:oklch(98.5% 0 0);--sidebar-foreground:oklch(14.5% 0 0);--sidebar-primary:oklch(20.5% 0 0);--sidebar-primary-foreground:oklch(98.5% 0 0);--sidebar-accent:oklch(97% 0 0);--sidebar-accent-foreground:oklch(20.5% 0 0);--sidebar-border:oklch(92.2% 0 0);--sidebar-ring:oklch(70.8% 0 0)}.dark,:host(.dark),.palette-scope.dark{--background:oklch(14.5% 0 0);--foreground:oklch(98.5% 0 0);--card:oklch(20.5% 0 0);--card-foreground:oklch(98.5% 0 0);--popover:oklch(20.5% 0 0);--popover-foreground:oklch(98.5% 0 0);--primary:oklch(92.2% 0 0);--primary-foreground:oklch(20.5% 0 0);--secondary:oklch(26.9% 0 0);--secondary-foreground:oklch(98.5% 0 0);--muted:oklch(26.9% 0 0);--muted-foreground:oklch(70.8% 0 0);--accent:oklch(26.9% 0 0);--accent-foreground:oklch(98.5% 0 0);--destructive:oklch(70.4% .191 22.216);--warning:oklch(82.8% .189 84.429);--border:oklch(100% 0 0/.1);--input:oklch(100% 0 0/.15);--ring:oklch(55.6% 0 0);--chart-1:oklch(87% 0 0);--chart-2:oklch(55.6% 0 0);--chart-3:oklch(43.9% 0 0);--chart-4:oklch(37.1% 0 0);--chart-5:oklch(26.9% 0 0);--sidebar:oklch(20.5% 0 0);--sidebar-foreground:oklch(98.5% 0 0);--sidebar-primary:oklch(48.8% .243 264.376);--sidebar-primary-foreground:oklch(98.5% 0 0);--sidebar-accent:oklch(26.9% 0 0);--sidebar-accent-foreground:oklch(98.5% 0 0);--sidebar-border:oklch(100% 0 0/.1);--sidebar-ring:oklch(55.6% 0 0)}:host{all:initial;--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;font-family:var(--font-sans);font-synthesis:none;text-rendering:optimizelegibility}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial}}[data-slot=dialog-portal],[data-slot=dialog-overlay],[data-slot=dialog-content]{color:var(--foreground);font-family:var(--font-sans);font-synthesis:none;pointer-events:auto;line-height:1.5}@keyframes s4e-progress-indeterminate{0%{transform:translate(-100%)}to{transform:translate(350%)}}[data-slot=progress-indeterminate]{animation:1.4s ease-in-out infinite s4e-progress-indeterminate}@media (prefers-reduced-motion:reduce){[data-slot=dialog-overlay],[data-slot=dialog-content],[data-slot=command].animate-surface-in,[data-slot=progress-indeterminate]{animation:none!important}[data-slot=progress-indicator]{transition:none!important}}.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.scroll-fade{--fade-depth:1.5rem}.scroll-fade[data-fade-mask=top]{-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%)}.scroll-fade[data-fade-mask=bottom]{-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent)}.scroll-fade[data-fade-mask=both]{-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent)}@property --tw-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-z{syntax:\"*\";inherits:false;initial-value:0}@property --tw-scale-x{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-y{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-z{syntax:\"*\";inherits:false;initial-value:1}@property --tw-rotate-x{syntax:\"*\";inherits:false}@property --tw-rotate-y{syntax:\"*\";inherits:false}@property --tw-rotate-z{syntax:\"*\";inherits:false}@property --tw-skew-x{syntax:\"*\";inherits:false}@property --tw-skew-y{syntax:\"*\";inherits:false}@property --tw-pan-x{syntax:\"*\";inherits:false}@property --tw-pan-y{syntax:\"*\";inherits:false}@property --tw-pinch-zoom{syntax:\"*\";inherits:false}@property --tw-space-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-space-x-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-divide-x-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-border-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-divide-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-leading{syntax:\"*\";inherits:false}@property --tw-font-weight{syntax:\"*\";inherits:false}@property --tw-tracking{syntax:\"*\";inherits:false}@property --tw-ordinal{syntax:\"*\";inherits:false}@property --tw-slashed-zero{syntax:\"*\";inherits:false}@property --tw-numeric-figure{syntax:\"*\";inherits:false}@property --tw-numeric-spacing{syntax:\"*\";inherits:false}@property --tw-numeric-fraction{syntax:\"*\";inherits:false}@property --tw-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:\"*\";inherits:false}@property --tw-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:\"*\";inherits:false}@property --tw-inset-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:\"*\";inherits:false}@property --tw-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:\"*\";inherits:false}@property --tw-inset-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:\"*\";inherits:false}@property --tw-ring-offset-width{syntax:\"<length>\";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:\"*\";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-blur{syntax:\"*\";inherits:false}@property --tw-brightness{syntax:\"*\";inherits:false}@property --tw-contrast{syntax:\"*\";inherits:false}@property --tw-grayscale{syntax:\"*\";inherits:false}@property --tw-hue-rotate{syntax:\"*\";inherits:false}@property --tw-invert{syntax:\"*\";inherits:false}@property --tw-opacity{syntax:\"*\";inherits:false}@property --tw-saturate{syntax:\"*\";inherits:false}@property --tw-sepia{syntax:\"*\";inherits:false}@property --tw-drop-shadow{syntax:\"*\";inherits:false}@property --tw-drop-shadow-color{syntax:\"*\";inherits:false}@property --tw-drop-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:\"*\";inherits:false}@property --tw-backdrop-blur{syntax:\"*\";inherits:false}@property --tw-backdrop-brightness{syntax:\"*\";inherits:false}@property --tw-backdrop-contrast{syntax:\"*\";inherits:false}@property --tw-backdrop-grayscale{syntax:\"*\";inherits:false}@property --tw-backdrop-hue-rotate{syntax:\"*\";inherits:false}@property --tw-backdrop-invert{syntax:\"*\";inherits:false}@property --tw-backdrop-opacity{syntax:\"*\";inherits:false}@property --tw-backdrop-saturate{syntax:\"*\";inherits:false}@property --tw-backdrop-sepia{syntax:\"*\";inherits:false}@property --tw-duration{syntax:\"*\";inherits:false}@property --tw-ease{syntax:\"*\";inherits:false}@property --tw-content{syntax:\"*\";inherits:false;initial-value:\"\"}@keyframes spin{to{transform:rotate(360deg)}}@keyframes enter{0%{opacity:var(--tw-enter-opacity,1);transform:translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0)scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1))rotate(var(--tw-enter-rotate,0));filter:blur(var(--tw-enter-blur,0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity,1);transform:translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0)scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1))rotate(var(--tw-exit-rotate,0));filter:blur(var(--tw-exit-blur,0))}}@keyframes scroll-fade-reveal-t{0%{--scroll-fade-t:0px}to{--scroll-fade-t:var(--_scroll-fade-size-t,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))))}}@keyframes scroll-fade-reveal-b{0%{--scroll-fade-b:var(--_scroll-fade-size-b,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))))}to{--scroll-fade-b:0px}}@keyframes tw-shimmer{0%{background-position:100% 0}to{background-position:0 0}}@keyframes s4e-dialog-in{0%{opacity:0;transform:translateY(10px)scale(.96)}}@keyframes s4e-dialog-out{to{opacity:0;transform:scale(.98)}}@keyframes s4e-overlay-in{0%{opacity:0}}@keyframes s4e-overlay-out{to{opacity:0}}@keyframes s4e-surface-in{0%{opacity:0;transform:translateY(6px)}}", b = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), x = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), S = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), C = (e) => {
	let t = S(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, w = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, T = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, ee = (0, _.createContext)({}), te = () => (0, _.useContext)(ee), E = (0, _.forwardRef)(({ color: e, size: t, strokeWidth: n, absoluteStrokeWidth: r, className: i = "", children: a, iconNode: o, ...s }, c) => {
	let { size: l = 24, strokeWidth: u = 2, absoluteStrokeWidth: d = !1, color: f = "currentColor", className: p = "" } = te() ?? {}, m = r ?? d ? Number(n ?? u) * 24 / Number(t ?? l) : n ?? u;
	return (0, _.createElement)("svg", {
		ref: c,
		...w,
		width: t ?? l ?? w.width,
		height: t ?? l ?? w.height,
		stroke: e ?? f,
		strokeWidth: m,
		className: b("lucide", p, i),
		...!a && !T(s) && { "aria-hidden": "true" },
		...s
	}, [...o.map(([e, t]) => (0, _.createElement)(e, t)), ...Array.isArray(a) ? a : [a]]);
}), D = (e, t) => {
	let n = (0, _.forwardRef)(({ className: n, ...r }, i) => (0, _.createElement)(E, {
		ref: i,
		iconNode: t,
		className: b(`lucide-${x(C(e))}`, `lucide-${e}`, n),
		...r
	}));
	return n.displayName = C(e), n;
}, ne = D("building-2", [
	["path", {
		d: "M10 12h4",
		key: "a56b0p"
	}],
	["path", {
		d: "M10 8h4",
		key: "1sr2af"
	}],
	["path", {
		d: "M14 21v-3a2 2 0 0 0-4 0v3",
		key: "1rgiei"
	}],
	["path", {
		d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
		key: "secmi2"
	}],
	["path", {
		d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
		key: "16ra0t"
	}]
]), re = D("check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]), ie = D("chevron-left", [["path", {
	d: "m15 18-6-6 6-6",
	key: "1wnfg3"
}]]), ae = D("circle-alert", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "8",
		y2: "12",
		key: "1pkeuh"
	}],
	["line", {
		x1: "12",
		x2: "12.01",
		y1: "16",
		y2: "16",
		key: "4dfq90"
	}]
]), oe = D("circle", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}]]), se = D("clock", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "M12 6v6l4 2",
	key: "mmk7yg"
}]]), O = D("file-spreadsheet", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M8 13h2",
		key: "yr2amv"
	}],
	["path", {
		d: "M14 13h2",
		key: "un5t4a"
	}],
	["path", {
		d: "M8 17h2",
		key: "2yhykz"
	}],
	["path", {
		d: "M14 17h2",
		key: "10kma7"
	}]
]), k = D("folder-open", [["path", {
	d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
	key: "usdka0"
}]]), A = D("loader-circle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]), ce = D("package", [
	["path", {
		d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
		key: "1a0edw"
	}],
	["path", {
		d: "M12 22V12",
		key: "d0xqtd"
	}],
	["polyline", {
		points: "3.29 7 12 12 20.71 7",
		key: "ousv84"
	}],
	["path", {
		d: "m7.5 4.27 9 5.15",
		key: "1c824w"
	}]
]), j = D("search", [["path", {
	d: "m21 21-4.34-4.34",
	key: "14j7rj"
}], ["circle", {
	cx: "11",
	cy: "11",
	r: "8",
	key: "4ej97u"
}]]), le = D("settings", [["path", {
	d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
	key: "1i5ecw"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]), M = D("triangle-alert", [
	["path", {
		d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
		key: "wmoenq"
	}],
	["path", {
		d: "M12 9v4",
		key: "juzpu7"
	}],
	["path", {
		d: "M12 17h.01",
		key: "p32p05"
	}]
]), N = D("truck", [
	["path", {
		d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
		key: "wrbu53"
	}],
	["path", {
		d: "M15 18H9",
		key: "1lyqi6"
	}],
	["path", {
		d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
		key: "lysw3i"
	}],
	["circle", {
		cx: "17",
		cy: "18",
		r: "2",
		key: "332jqn"
	}],
	["circle", {
		cx: "7",
		cy: "18",
		r: "2",
		key: "19iecd"
	}]
]), ue = D("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]);
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function de(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = de(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function fe() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = de(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/class-variance-authority/dist/index.mjs
var pe = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, me = fe, he = (e, t) => (n) => {
	if (t?.variants == null) return me(e, n?.class, n?.className);
	let { variants: r, defaultVariants: i } = t, a = Object.keys(r).map((e) => {
		let t = n?.[e], a = i?.[e];
		if (t === null) return null;
		let o = pe(t) || pe(a);
		return r[e][o];
	}), o = n && Object.entries(n).reduce((e, t) => {
		let [n, r] = t;
		return r === void 0 || (e[n] = r), e;
	}, {});
	return me(e, a, t?.compoundVariants?.reduce((e, t) => {
		let { class: n, className: r, ...a } = t;
		return Object.entries(a).every((e) => {
			let [t, n] = e;
			return Array.isArray(n) ? n.includes({
				...i,
				...o
			}[t]) : {
				...i,
				...o
			}[t] === n;
		}) ? [
			...e,
			n,
			r
		] : e;
	}, []), n?.class, n?.className);
}, ge = (e, t) => {
	let n = Array(e.length + t.length);
	for (let t = 0; t < e.length; t++) n[t] = e[t];
	for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
	return n;
}, _e = (e, t) => ({
	classGroupId: e,
	validator: t
}), ve = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
	nextPart: e,
	validators: t,
	classGroupId: n
}), ye = "-", be = [], xe = "arbitrary..", Se = (e) => {
	let t = Te(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			if (e.startsWith("[") && e.endsWith("]")) return we(e);
			let n = e.split(ye);
			return Ce(n, +(n[0] === "" && n.length > 1), t);
		},
		getConflictingClassGroupIds: (e, t) => {
			if (t) {
				let t = r[e], i = n[e];
				return t ? i ? ge(i, t) : t : i || be;
			}
			return n[e] || be;
		}
	};
}, Ce = (e, t, n) => {
	if (e.length - t === 0) return n.classGroupId;
	let r = e[t], i = n.nextPart.get(r);
	if (i) {
		let n = Ce(e, t + 1, i);
		if (n) return n;
	}
	let a = n.validators;
	if (a === null) return;
	let o = t === 0 ? e.join(ye) : e.slice(t).join(ye), s = a.length;
	for (let e = 0; e < s; e++) {
		let t = a[e];
		if (t.validator(o)) return t.classGroupId;
	}
}, we = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	let t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
	return r ? xe + r : void 0;
})(), Te = (e) => {
	let { theme: t, classGroups: n } = e;
	return Ee(n, t);
}, Ee = (e, t) => {
	let n = ve();
	for (let r in e) {
		let i = e[r];
		De(i, n, r, t);
	}
	return n;
}, De = (e, t, n, r) => {
	let i = e.length;
	for (let a = 0; a < i; a++) {
		let i = e[a];
		Oe(i, t, n, r);
	}
}, Oe = (e, t, n, r) => {
	if (typeof e == "string") {
		ke(e, t, n);
		return;
	}
	if (typeof e == "function") {
		Ae(e, t, n, r);
		return;
	}
	je(e, t, n, r);
}, ke = (e, t, n) => {
	let r = e === "" ? t : Me(t, e);
	r.classGroupId = n;
}, Ae = (e, t, n, r) => {
	if (Ne(e)) {
		De(e(r), t, n, r);
		return;
	}
	t.validators === null && (t.validators = []), t.validators.push(_e(n, e));
}, je = (e, t, n, r) => {
	let i = Object.entries(e), a = i.length;
	for (let e = 0; e < a; e++) {
		let [a, o] = i[e];
		De(o, Me(t, a), n, r);
	}
}, Me = (e, t) => {
	let n = e, r = t.split(ye), i = r.length;
	for (let e = 0; e < i; e++) {
		let t = r[e], i = n.nextPart.get(t);
		i || (i = ve(), n.nextPart.set(t, i)), n = i;
	}
	return n;
}, Ne = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, Pe = (e) => {
	if (e < 1) return {
		get: () => void 0,
		set: () => {}
	};
	let t = 0, n = Object.create(null), r = Object.create(null), i = (i, a) => {
		n[i] = a, t++, t > e && (t = 0, r = n, n = Object.create(null));
	};
	return {
		get(e) {
			let t = n[e];
			if (t !== void 0) return t;
			if ((t = r[e]) !== void 0) return i(e, t), t;
		},
		set(e, t) {
			e in n ? n[e] = t : i(e, t);
		}
	};
}, Fe = "!", Ie = ":", Le = [], Re = (e, t, n, r, i) => ({
	modifiers: e,
	hasImportantModifier: t,
	baseClassName: n,
	maybePostfixModifierPosition: r,
	isExternal: i
}), ze = (e) => {
	let { prefix: t, experimentalParseClassName: n } = e, r = (e) => {
		let t = [], n = 0, r = 0, i = 0, a, o = e.length;
		for (let s = 0; s < o; s++) {
			let o = e[s];
			if (n === 0 && r === 0) {
				if (o === Ie) {
					t.push(e.slice(i, s)), i = s + 1;
					continue;
				}
				if (o === "/") {
					a = s;
					continue;
				}
			}
			o === "[" ? n++ : o === "]" ? n-- : o === "(" ? r++ : o === ")" && r--;
		}
		let s = t.length === 0 ? e : e.slice(i), c = s, l = !1;
		s.endsWith(Fe) ? (c = s.slice(0, -1), l = !0) : s.startsWith(Fe) && (c = s.slice(1), l = !0);
		let u = a && a > i ? a - i : void 0;
		return Re(t, l, c, u);
	};
	if (t) {
		let e = t + Ie, n = r;
		r = (t) => t.startsWith(e) ? n(t.slice(e.length)) : Re(Le, !1, t, void 0, !0);
	}
	if (n) {
		let e = r;
		r = (t) => n({
			className: t,
			parseClassName: e
		});
	}
	return r;
}, Be = (e) => {
	let t = /* @__PURE__ */ new Map();
	return e.orderSensitiveModifiers.forEach((e, n) => {
		t.set(e, 1e6 + n);
	}), (e) => {
		let n = [], r = [];
		for (let i = 0; i < e.length; i++) {
			let a = e[i], o = a[0] === "[", s = t.has(a);
			o || s ? (r.length > 0 && (r.sort(), n.push(...r), r = []), n.push(a)) : r.push(a);
		}
		return r.length > 0 && (r.sort(), n.push(...r)), n;
	};
}, Ve = (e) => ({
	cache: Pe(e.cacheSize),
	parseClassName: ze(e),
	sortModifiers: Be(e),
	postfixLookupClassGroupIds: He(e),
	...Se(e)
}), He = (e) => {
	let t = Object.create(null), n = e.postfixLookupClassGroups;
	if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
	return t;
}, Ue = /\s+/, We = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i, sortModifiers: a, postfixLookupClassGroupIds: o } = t, s = [], c = e.trim().split(Ue), l = "";
	for (let e = c.length - 1; e >= 0; --e) {
		let t = c[e], { isExternal: u, modifiers: d, hasImportantModifier: f, baseClassName: p, maybePostfixModifierPosition: m } = n(t);
		if (u) {
			l = t + (l.length > 0 ? " " + l : l);
			continue;
		}
		let h = !!m, g;
		if (h) {
			g = r(p.substring(0, m));
			let e = g && o[g] ? r(p) : void 0;
			e && e !== g && (g = e, h = !1);
		} else g = r(p);
		if (!g) {
			if (!h) {
				l = t + (l.length > 0 ? " " + l : l);
				continue;
			}
			if (g = r(p), !g) {
				l = t + (l.length > 0 ? " " + l : l);
				continue;
			}
			h = !1;
		}
		let _ = d.length === 0 ? "" : d.length === 1 ? d[0] : a(d).join(":"), v = f ? _ + Fe : _, y = v + g;
		if (s.indexOf(y) > -1) continue;
		s.push(y);
		let b = i(g, h);
		for (let e = 0; e < b.length; ++e) {
			let t = b[e];
			s.push(v + t);
		}
		l = t + (l.length > 0 ? " " + l : l);
	}
	return l;
}, Ge = (...e) => {
	let t = 0, n, r, i = "";
	for (; t < e.length;) (n = e[t++]) && (r = Ke(n)) && (i && (i += " "), i += r);
	return i;
}, Ke = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = Ke(e[r])) && (n && (n += " "), n += t);
	return n;
}, qe = (e, ...t) => {
	let n, r, i, a, o = (o) => (n = Ve(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)), s = (e) => {
		let t = r(e);
		if (t) return t;
		let a = We(e, n);
		return i(e, a), a;
	};
	return a = o, (...e) => a(Ge(...e));
}, Je = [], P = (e) => {
	let t = (t) => t[e] || Je;
	return t.isThemeGetter = !0, t;
}, Ye = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, Xe = /^\((?:(\w[\w-]*):)?(.+)\)$/i, Ze = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/, Qe = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, $e = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, et = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, tt = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, nt = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, rt = (e) => Ze.test(e), F = (e) => !!e && !Number.isNaN(Number(e)), it = (e) => !!e && Number.isInteger(Number(e)), at = (e) => e.endsWith("%") && F(e.slice(0, -1)), ot = (e) => Qe.test(e), st = () => !0, ct = (e) => $e.test(e) && !et.test(e), lt = () => !1, ut = (e) => tt.test(e), dt = (e) => nt.test(e), ft = (e) => !I(e) && !L(e), pt = (e) => e.startsWith("@container") && (e[10] === "/" && e[11] !== void 0 || e[11] === "s" && e[16] !== void 0 && e.startsWith("-size/", 10) || e[11] === "n" && e[18] !== void 0 && e.startsWith("-normal/", 10)), mt = (e) => kt(e, Nt, lt), I = (e) => Ye.test(e), ht = (e) => kt(e, Pt, ct), gt = (e) => kt(e, Ft, F), _t = (e) => kt(e, Lt, st), vt = (e) => kt(e, It, lt), yt = (e) => kt(e, jt, lt), bt = (e) => kt(e, Mt, dt), xt = (e) => kt(e, Rt, ut), L = (e) => Xe.test(e), St = (e) => At(e, Pt), Ct = (e) => At(e, It), wt = (e) => At(e, jt), Tt = (e) => At(e, Nt), Et = (e) => At(e, Mt), Dt = (e) => At(e, Rt, !0), Ot = (e) => At(e, Lt, !0), kt = (e, t, n) => {
	let r = Ye.exec(e);
	return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, At = (e, t, n = !1) => {
	let r = Xe.exec(e);
	return r ? r[1] ? t(r[1]) : n : !1;
}, jt = (e) => e === "position" || e === "percentage", Mt = (e) => e === "image" || e === "url", Nt = (e) => e === "length" || e === "size" || e === "bg-size", Pt = (e) => e === "length", Ft = (e) => e === "number", It = (e) => e === "family-name", Lt = (e) => e === "number" || e === "weight", Rt = (e) => e === "shadow", zt = /*#__PURE__*/ qe(() => {
	let e = P("color"), t = P("font"), n = P("text"), r = P("font-weight"), i = P("tracking"), a = P("leading"), o = P("breakpoint"), s = P("container"), c = P("spacing"), l = P("radius"), u = P("shadow"), d = P("inset-shadow"), f = P("text-shadow"), p = P("drop-shadow"), m = P("blur"), h = P("perspective"), g = P("aspect"), _ = P("ease"), v = P("animate"), y = () => [
		"auto",
		"avoid",
		"all",
		"avoid-page",
		"page",
		"left",
		"right",
		"column"
	], b = () => [
		"center",
		"top",
		"bottom",
		"left",
		"right",
		"top-left",
		"left-top",
		"top-right",
		"right-top",
		"bottom-right",
		"right-bottom",
		"bottom-left",
		"left-bottom"
	], x = () => [
		...b(),
		L,
		I
	], S = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	], C = () => [
		"auto",
		"contain",
		"none"
	], w = () => [
		L,
		I,
		c
	], T = () => [
		rt,
		"full",
		"auto",
		...w()
	], ee = () => [
		it,
		"none",
		"subgrid",
		L,
		I
	], te = () => [
		"auto",
		{ span: [
			"full",
			it,
			L,
			I
		] },
		it,
		L,
		I
	], E = () => [
		it,
		"auto",
		L,
		I
	], D = () => [
		"auto",
		"min",
		"max",
		"fr",
		L,
		I
	], ne = () => [
		"start",
		"end",
		"center",
		"between",
		"around",
		"evenly",
		"stretch",
		"baseline",
		"center-safe",
		"end-safe"
	], re = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	], ie = () => ["auto", ...w()], ae = () => [
		rt,
		"auto",
		"full",
		"dvw",
		"dvh",
		"lvw",
		"lvh",
		"svw",
		"svh",
		"min",
		"max",
		"fit",
		...w()
	], oe = () => [
		rt,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...w()
	], se = () => [
		rt,
		"screen",
		"full",
		"lh",
		"dvh",
		"lvh",
		"svh",
		"min",
		"max",
		"fit",
		...w()
	], O = () => [
		e,
		L,
		I
	], k = () => [
		...b(),
		wt,
		yt,
		{ position: [L, I] }
	], A = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }], ce = () => [
		"auto",
		"cover",
		"contain",
		Tt,
		mt,
		{ size: [L, I] }
	], j = () => [
		at,
		St,
		ht
	], le = () => [
		"",
		"none",
		"full",
		l,
		L,
		I
	], M = () => [
		"",
		F,
		St,
		ht
	], N = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	], ue = () => [
		"normal",
		"multiply",
		"screen",
		"overlay",
		"darken",
		"lighten",
		"color-dodge",
		"color-burn",
		"hard-light",
		"soft-light",
		"difference",
		"exclusion",
		"hue",
		"saturation",
		"color",
		"luminosity"
	], de = () => [
		F,
		at,
		wt,
		yt
	], fe = () => [
		"",
		"none",
		m,
		L,
		I
	], pe = () => [
		"none",
		F,
		L,
		I
	], me = () => [
		"none",
		F,
		L,
		I
	], he = () => [
		F,
		L,
		I
	], ge = () => [
		rt,
		"full",
		...w()
	];
	return {
		cacheSize: 500,
		theme: {
			animate: [
				"spin",
				"ping",
				"pulse",
				"bounce"
			],
			aspect: ["video"],
			blur: [ot],
			breakpoint: [ot],
			color: [st],
			container: [ot],
			"drop-shadow": [ot],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [ft],
			"font-weight": [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black"
			],
			"inset-shadow": [ot],
			leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose"
			],
			perspective: [
				"dramatic",
				"near",
				"normal",
				"midrange",
				"distant",
				"none"
			],
			radius: [ot],
			shadow: [ot],
			spacing: ["px", F],
			text: [ot],
			"text-shadow": [ot],
			tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest"
			]
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				rt,
				I,
				L,
				g
			] }],
			container: ["container"],
			"container-type": [{ "@container": [
				"",
				"normal",
				"size",
				L,
				I
			] }],
			"container-named": [pt],
			columns: [{ columns: [
				F,
				I,
				L,
				s
			] }],
			"break-after": [{ "break-after": y() }],
			"break-before": [{ "break-before": y() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
			"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
			box: [{ box: ["border", "content"] }],
			display: [
				"block",
				"inline-block",
				"inline",
				"flex",
				"inline-flex",
				"table",
				"inline-table",
				"table-caption",
				"table-cell",
				"table-column",
				"table-column-group",
				"table-footer-group",
				"table-header-group",
				"table-row-group",
				"table-row",
				"flow-root",
				"grid",
				"inline-grid",
				"contents",
				"list-item",
				"hidden"
			],
			sr: ["sr-only", "not-sr-only"],
			float: [{ float: [
				"right",
				"left",
				"none",
				"start",
				"end"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none",
				"start",
				"end"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: x() }],
			overflow: [{ overflow: S() }],
			"overflow-x": [{ "overflow-x": S() }],
			"overflow-y": [{ "overflow-y": S() }],
			overscroll: [{ overscroll: C() }],
			"overscroll-x": [{ "overscroll-x": C() }],
			"overscroll-y": [{ "overscroll-y": C() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: T() }],
			"inset-x": [{ "inset-x": T() }],
			"inset-y": [{ "inset-y": T() }],
			start: [{
				"inset-s": T(),
				start: T()
			}],
			end: [{
				"inset-e": T(),
				end: T()
			}],
			"inset-bs": [{ "inset-bs": T() }],
			"inset-be": [{ "inset-be": T() }],
			top: [{ top: T() }],
			right: [{ right: T() }],
			bottom: [{ bottom: T() }],
			left: [{ left: T() }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				it,
				"auto",
				L,
				I
			] }],
			basis: [{ basis: [
				rt,
				"full",
				"auto",
				s,
				...w()
			] }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"nowrap",
				"wrap",
				"wrap-reverse"
			] }],
			flex: [{ flex: [
				F,
				rt,
				"auto",
				"initial",
				"none",
				I
			] }],
			grow: [{ grow: [
				"",
				F,
				L,
				I
			] }],
			shrink: [{ shrink: [
				"",
				F,
				L,
				I
			] }],
			order: [{ order: [
				it,
				"first",
				"last",
				"none",
				L,
				I
			] }],
			"grid-cols": [{ "grid-cols": ee() }],
			"col-start-end": [{ col: te() }],
			"col-start": [{ "col-start": E() }],
			"col-end": [{ "col-end": E() }],
			"grid-rows": [{ "grid-rows": ee() }],
			"row-start-end": [{ row: te() }],
			"row-start": [{ "row-start": E() }],
			"row-end": [{ "row-end": E() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": D() }],
			"auto-rows": [{ "auto-rows": D() }],
			gap: [{ gap: w() }],
			"gap-x": [{ "gap-x": w() }],
			"gap-y": [{ "gap-y": w() }],
			"justify-content": [{ justify: [...ne(), "normal"] }],
			"justify-items": [{ "justify-items": [...re(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...re()] }],
			"align-content": [{ content: ["normal", ...ne()] }],
			"align-items": [{ items: [...re(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...re(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": ne() }],
			"place-items": [{ "place-items": [...re(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...re()] }],
			p: [{ p: w() }],
			px: [{ px: w() }],
			py: [{ py: w() }],
			ps: [{ ps: w() }],
			pe: [{ pe: w() }],
			pbs: [{ pbs: w() }],
			pbe: [{ pbe: w() }],
			pt: [{ pt: w() }],
			pr: [{ pr: w() }],
			pb: [{ pb: w() }],
			pl: [{ pl: w() }],
			m: [{ m: ie() }],
			mx: [{ mx: ie() }],
			my: [{ my: ie() }],
			ms: [{ ms: ie() }],
			me: [{ me: ie() }],
			mbs: [{ mbs: ie() }],
			mbe: [{ mbe: ie() }],
			mt: [{ mt: ie() }],
			mr: [{ mr: ie() }],
			mb: [{ mb: ie() }],
			ml: [{ ml: ie() }],
			"space-x": [{ "space-x": w() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": w() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: ae() }],
			"inline-size": [{ inline: ["auto", ...oe()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...oe()] }],
			"max-inline-size": [{ "max-inline": ["none", ...oe()] }],
			"block-size": [{ block: ["auto", ...se()] }],
			"min-block-size": [{ "min-block": ["auto", ...se()] }],
			"max-block-size": [{ "max-block": ["none", ...se()] }],
			w: [{ w: [
				s,
				"screen",
				...ae()
			] }],
			"min-w": [{ "min-w": [
				s,
				"screen",
				"none",
				...ae()
			] }],
			"max-w": [{ "max-w": [
				s,
				"screen",
				"none",
				"prose",
				{ screen: [o] },
				...ae()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...ae()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...ae()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				...ae()
			] }],
			"font-size": [{ text: [
				"base",
				n,
				St,
				ht
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				r,
				Ot,
				_t
			] }],
			"font-stretch": [{ "font-stretch": [
				"ultra-condensed",
				"extra-condensed",
				"condensed",
				"semi-condensed",
				"normal",
				"semi-expanded",
				"expanded",
				"extra-expanded",
				"ultra-expanded",
				at,
				I
			] }],
			"font-family": [{ font: [
				Ct,
				vt,
				t
			] }],
			"font-features": [{ "font-features": [I] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				i,
				L,
				I
			] }],
			"line-clamp": [{ "line-clamp": [
				F,
				"none",
				L,
				gt
			] }],
			leading: [{ leading: [a, ...w()] }],
			"list-image": [{ "list-image": [
				"none",
				L,
				I
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				L,
				I
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: O() }],
			"text-color": [{ text: O() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...N(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				F,
				"from-font",
				"auto",
				L,
				ht
			] }],
			"text-decoration-color": [{ decoration: O() }],
			"underline-offset": [{ "underline-offset": [
				F,
				"auto",
				L,
				I
			] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			"text-wrap": [{ text: [
				"wrap",
				"nowrap",
				"balance",
				"pretty"
			] }],
			indent: [{ indent: w() }],
			"tab-size": [{ tab: [
				it,
				L,
				I
			] }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				L,
				I
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			wrap: [{ wrap: [
				"break-word",
				"anywhere",
				"normal"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: [
				"none",
				L,
				I
			] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: k() }],
			"bg-repeat": [{ bg: A() }],
			"bg-size": [{ bg: ce() }],
			"bg-image": [{ bg: [
				"none",
				{
					linear: [
						{ to: [
							"t",
							"tr",
							"r",
							"br",
							"b",
							"bl",
							"l",
							"tl"
						] },
						it,
						L,
						I
					],
					radial: [
						"",
						L,
						I
					],
					conic: [
						it,
						L,
						I
					]
				},
				Et,
				bt
			] }],
			"bg-color": [{ bg: O() }],
			"gradient-from-pos": [{ from: j() }],
			"gradient-via-pos": [{ via: j() }],
			"gradient-to-pos": [{ to: j() }],
			"gradient-from": [{ from: O() }],
			"gradient-via": [{ via: O() }],
			"gradient-to": [{ to: O() }],
			rounded: [{ rounded: le() }],
			"rounded-s": [{ "rounded-s": le() }],
			"rounded-e": [{ "rounded-e": le() }],
			"rounded-t": [{ "rounded-t": le() }],
			"rounded-r": [{ "rounded-r": le() }],
			"rounded-b": [{ "rounded-b": le() }],
			"rounded-l": [{ "rounded-l": le() }],
			"rounded-ss": [{ "rounded-ss": le() }],
			"rounded-se": [{ "rounded-se": le() }],
			"rounded-ee": [{ "rounded-ee": le() }],
			"rounded-es": [{ "rounded-es": le() }],
			"rounded-tl": [{ "rounded-tl": le() }],
			"rounded-tr": [{ "rounded-tr": le() }],
			"rounded-br": [{ "rounded-br": le() }],
			"rounded-bl": [{ "rounded-bl": le() }],
			"border-w": [{ border: M() }],
			"border-w-x": [{ "border-x": M() }],
			"border-w-y": [{ "border-y": M() }],
			"border-w-s": [{ "border-s": M() }],
			"border-w-e": [{ "border-e": M() }],
			"border-w-bs": [{ "border-bs": M() }],
			"border-w-be": [{ "border-be": M() }],
			"border-w-t": [{ "border-t": M() }],
			"border-w-r": [{ "border-r": M() }],
			"border-w-b": [{ "border-b": M() }],
			"border-w-l": [{ "border-l": M() }],
			"divide-x": [{ "divide-x": M() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": M() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...N(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...N(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: O() }],
			"border-color-x": [{ "border-x": O() }],
			"border-color-y": [{ "border-y": O() }],
			"border-color-s": [{ "border-s": O() }],
			"border-color-e": [{ "border-e": O() }],
			"border-color-bs": [{ "border-bs": O() }],
			"border-color-be": [{ "border-be": O() }],
			"border-color-t": [{ "border-t": O() }],
			"border-color-r": [{ "border-r": O() }],
			"border-color-b": [{ "border-b": O() }],
			"border-color-l": [{ "border-l": O() }],
			"divide-color": [{ divide: O() }],
			"outline-style": [{ outline: [
				...N(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				F,
				L,
				I
			] }],
			"outline-w": [{ outline: [
				"",
				F,
				St,
				ht
			] }],
			"outline-color": [{ outline: O() }],
			shadow: [{ shadow: [
				"",
				"none",
				u,
				Dt,
				xt
			] }],
			"shadow-color": [{ shadow: O() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				d,
				Dt,
				xt
			] }],
			"inset-shadow-color": [{ "inset-shadow": O() }],
			"ring-w": [{ ring: M() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: O() }],
			"ring-offset-w": [{ "ring-offset": [F, ht] }],
			"ring-offset-color": [{ "ring-offset": O() }],
			"inset-ring-w": [{ "inset-ring": M() }],
			"inset-ring-color": [{ "inset-ring": O() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				f,
				Dt,
				xt
			] }],
			"text-shadow-color": [{ "text-shadow": O() }],
			opacity: [{ opacity: [
				F,
				L,
				I
			] }],
			"mix-blend": [{ "mix-blend": [
				...ue(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": ue() }],
			"mask-clip": [{ "mask-clip": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }, "mask-no-clip"],
			"mask-composite": [{ mask: [
				"add",
				"subtract",
				"intersect",
				"exclude"
			] }],
			"mask-image-linear-pos": [{ "mask-linear": [F] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": de() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": de() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": O() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": O() }],
			"mask-image-t-from-pos": [{ "mask-t-from": de() }],
			"mask-image-t-to-pos": [{ "mask-t-to": de() }],
			"mask-image-t-from-color": [{ "mask-t-from": O() }],
			"mask-image-t-to-color": [{ "mask-t-to": O() }],
			"mask-image-r-from-pos": [{ "mask-r-from": de() }],
			"mask-image-r-to-pos": [{ "mask-r-to": de() }],
			"mask-image-r-from-color": [{ "mask-r-from": O() }],
			"mask-image-r-to-color": [{ "mask-r-to": O() }],
			"mask-image-b-from-pos": [{ "mask-b-from": de() }],
			"mask-image-b-to-pos": [{ "mask-b-to": de() }],
			"mask-image-b-from-color": [{ "mask-b-from": O() }],
			"mask-image-b-to-color": [{ "mask-b-to": O() }],
			"mask-image-l-from-pos": [{ "mask-l-from": de() }],
			"mask-image-l-to-pos": [{ "mask-l-to": de() }],
			"mask-image-l-from-color": [{ "mask-l-from": O() }],
			"mask-image-l-to-color": [{ "mask-l-to": O() }],
			"mask-image-x-from-pos": [{ "mask-x-from": de() }],
			"mask-image-x-to-pos": [{ "mask-x-to": de() }],
			"mask-image-x-from-color": [{ "mask-x-from": O() }],
			"mask-image-x-to-color": [{ "mask-x-to": O() }],
			"mask-image-y-from-pos": [{ "mask-y-from": de() }],
			"mask-image-y-to-pos": [{ "mask-y-to": de() }],
			"mask-image-y-from-color": [{ "mask-y-from": O() }],
			"mask-image-y-to-color": [{ "mask-y-to": O() }],
			"mask-image-radial": [{ "mask-radial": [L, I] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": de() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": de() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": O() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": O() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": b() }],
			"mask-image-conic-pos": [{ "mask-conic": [F] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": de() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": de() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": O() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": O() }],
			"mask-mode": [{ mask: [
				"alpha",
				"luminance",
				"match"
			] }],
			"mask-origin": [{ "mask-origin": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }],
			"mask-position": [{ mask: k() }],
			"mask-repeat": [{ mask: A() }],
			"mask-size": [{ mask: ce() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				L,
				I
			] }],
			filter: [{ filter: [
				"",
				"none",
				L,
				I
			] }],
			blur: [{ blur: fe() }],
			brightness: [{ brightness: [
				F,
				L,
				I
			] }],
			contrast: [{ contrast: [
				F,
				L,
				I
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				p,
				Dt,
				xt
			] }],
			"drop-shadow-color": [{ "drop-shadow": O() }],
			grayscale: [{ grayscale: [
				"",
				F,
				L,
				I
			] }],
			"hue-rotate": [{ "hue-rotate": [
				F,
				L,
				I
			] }],
			invert: [{ invert: [
				"",
				F,
				L,
				I
			] }],
			saturate: [{ saturate: [
				F,
				L,
				I
			] }],
			sepia: [{ sepia: [
				"",
				F,
				L,
				I
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				L,
				I
			] }],
			"backdrop-blur": [{ "backdrop-blur": fe() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				F,
				L,
				I
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				F,
				L,
				I
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				F,
				L,
				I
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				F,
				L,
				I
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				F,
				L,
				I
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				F,
				L,
				I
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				F,
				L,
				I
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				F,
				L,
				I
			] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": w() }],
			"border-spacing-x": [{ "border-spacing-x": w() }],
			"border-spacing-y": [{ "border-spacing-y": w() }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"",
				"all",
				"colors",
				"opacity",
				"shadow",
				"transform",
				"none",
				L,
				I
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				F,
				"initial",
				L,
				I
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				_,
				L,
				I
			] }],
			delay: [{ delay: [
				F,
				L,
				I
			] }],
			animate: [{ animate: [
				"none",
				v,
				L,
				I
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				h,
				L,
				I
			] }],
			"perspective-origin": [{ "perspective-origin": x() }],
			rotate: [{ rotate: pe() }],
			"rotate-x": [{ "rotate-x": pe() }],
			"rotate-y": [{ "rotate-y": pe() }],
			"rotate-z": [{ "rotate-z": pe() }],
			scale: [{ scale: me() }],
			"scale-x": [{ "scale-x": me() }],
			"scale-y": [{ "scale-y": me() }],
			"scale-z": [{ "scale-z": me() }],
			"scale-3d": ["scale-3d"],
			skew: [{ skew: he() }],
			"skew-x": [{ "skew-x": he() }],
			"skew-y": [{ "skew-y": he() }],
			transform: [{ transform: [
				L,
				I,
				"",
				"none",
				"gpu",
				"cpu"
			] }],
			"transform-origin": [{ origin: x() }],
			"transform-style": [{ transform: ["3d", "flat"] }],
			translate: [{ translate: ge() }],
			"translate-x": [{ "translate-x": ge() }],
			"translate-y": [{ "translate-y": ge() }],
			"translate-z": [{ "translate-z": ge() }],
			"translate-none": ["translate-none"],
			zoom: [{ zoom: [
				it,
				L,
				I
			] }],
			accent: [{ accent: O() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: O() }],
			"color-scheme": [{ scheme: [
				"normal",
				"dark",
				"light",
				"light-dark",
				"only-dark",
				"only-light"
			] }],
			cursor: [{ cursor: [
				"auto",
				"default",
				"pointer",
				"wait",
				"text",
				"move",
				"help",
				"not-allowed",
				"none",
				"context-menu",
				"progress",
				"cell",
				"crosshair",
				"vertical-text",
				"alias",
				"copy",
				"no-drop",
				"grab",
				"grabbing",
				"all-scroll",
				"col-resize",
				"row-resize",
				"n-resize",
				"e-resize",
				"s-resize",
				"w-resize",
				"ne-resize",
				"nw-resize",
				"se-resize",
				"sw-resize",
				"ew-resize",
				"ns-resize",
				"nesw-resize",
				"nwse-resize",
				"zoom-in",
				"zoom-out",
				L,
				I
			] }],
			"field-sizing": [{ "field-sizing": ["fixed", "content"] }],
			"pointer-events": [{ "pointer-events": ["auto", "none"] }],
			resize: [{ resize: [
				"none",
				"",
				"y",
				"x"
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scrollbar-thumb-color": [{ "scrollbar-thumb": O() }],
			"scrollbar-track-color": [{ "scrollbar-track": O() }],
			"scrollbar-gutter": [{ "scrollbar-gutter": [
				"auto",
				"stable",
				"both"
			] }],
			"scrollbar-w": [{ scrollbar: [
				"auto",
				"thin",
				"none"
			] }],
			"scroll-m": [{ "scroll-m": w() }],
			"scroll-mx": [{ "scroll-mx": w() }],
			"scroll-my": [{ "scroll-my": w() }],
			"scroll-ms": [{ "scroll-ms": w() }],
			"scroll-me": [{ "scroll-me": w() }],
			"scroll-mbs": [{ "scroll-mbs": w() }],
			"scroll-mbe": [{ "scroll-mbe": w() }],
			"scroll-mt": [{ "scroll-mt": w() }],
			"scroll-mr": [{ "scroll-mr": w() }],
			"scroll-mb": [{ "scroll-mb": w() }],
			"scroll-ml": [{ "scroll-ml": w() }],
			"scroll-p": [{ "scroll-p": w() }],
			"scroll-px": [{ "scroll-px": w() }],
			"scroll-py": [{ "scroll-py": w() }],
			"scroll-ps": [{ "scroll-ps": w() }],
			"scroll-pe": [{ "scroll-pe": w() }],
			"scroll-pbs": [{ "scroll-pbs": w() }],
			"scroll-pbe": [{ "scroll-pbe": w() }],
			"scroll-pt": [{ "scroll-pt": w() }],
			"scroll-pr": [{ "scroll-pr": w() }],
			"scroll-pb": [{ "scroll-pb": w() }],
			"scroll-pl": [{ "scroll-pl": w() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"manipulation"
			] }],
			"touch-x": [{ "touch-pan": [
				"x",
				"left",
				"right"
			] }],
			"touch-y": [{ "touch-pan": [
				"y",
				"up",
				"down"
			] }],
			"touch-pz": ["touch-pinch-zoom"],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				L,
				I
			] }],
			fill: [{ fill: ["none", ...O()] }],
			"stroke-w": [{ stroke: [
				F,
				St,
				ht,
				gt
			] }],
			stroke: [{ stroke: ["none", ...O()] }],
			"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
		},
		conflictingClassGroups: {
			"container-named": ["container-type"],
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"inset-bs",
				"inset-be",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": ["right", "left"],
			"inset-y": ["top", "bottom"],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pbs",
				"pbe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: ["pr", "pl"],
			py: ["pt", "pb"],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mbs",
				"mbe",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: ["mr", "ml"],
			my: ["mt", "mb"],
			size: ["w", "h"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
			],
			"fvn-ordinal": ["fvn-normal"],
			"fvn-slashed-zero": ["fvn-normal"],
			"fvn-figure": ["fvn-normal"],
			"fvn-spacing": ["fvn-normal"],
			"fvn-fraction": ["fvn-normal"],
			"line-clamp": ["display", "overflow"],
			rounded: [
				"rounded-s",
				"rounded-e",
				"rounded-t",
				"rounded-r",
				"rounded-b",
				"rounded-l",
				"rounded-ss",
				"rounded-se",
				"rounded-ee",
				"rounded-es",
				"rounded-tl",
				"rounded-tr",
				"rounded-br",
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-x",
				"border-w-y",
				"border-w-s",
				"border-w-e",
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": ["border-w-r", "border-w-l"],
			"border-w-y": ["border-w-t", "border-w-b"],
			"border-color": [
				"border-color-x",
				"border-color-y",
				"border-color-s",
				"border-color-e",
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": ["border-color-r", "border-color-l"],
			"border-color-y": ["border-color-t", "border-color-b"],
			translate: [
				"translate-x",
				"translate-y",
				"translate-none"
			],
			"translate-none": [
				"translate",
				"translate-x",
				"translate-y",
				"translate-z"
			],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": ["scroll-mr", "scroll-ml"],
			"scroll-my": ["scroll-mt", "scroll-mb"],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": ["scroll-pr", "scroll-pl"],
			"scroll-py": ["scroll-pt", "scroll-pb"],
			touch: [
				"touch-x",
				"touch-y",
				"touch-pz"
			],
			"touch-x": ["touch"],
			"touch-y": ["touch"],
			"touch-pz": ["touch"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] },
		postfixLookupClassGroups: ["container-type"],
		orderSensitiveModifiers: [
			"*",
			"**",
			"after",
			"backdrop",
			"before",
			"details-content",
			"file",
			"first-letter",
			"first-line",
			"marker",
			"placeholder",
			"selection"
		]
	};
});
//#endregion
//#region src/lib/utils.ts
function R(...e) {
	return zt(fe(e));
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var Bt = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), z = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Bt();
})))(), Vt = he("group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4", {
	variants: { variant: {
		default: "bg-card text-card-foreground",
		destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
	} },
	defaultVariants: { variant: "default" }
});
function Ht({ className: e, variant: t, ...n }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		"data-slot": "alert",
		role: "alert",
		className: R(Vt({ variant: t }), e),
		...n
	});
}
function Ut({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		"data-slot": "alert-title",
		className: R("font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground", e),
		...t
	});
}
function Wt({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		"data-slot": "alert-description",
		className: R("text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4", e),
		...t
	});
}
//#endregion
//#region node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var Gt = Object.defineProperty, Kt = (e, t) => Gt(e, "name", {
	value: t,
	configurable: !0
});
function qt(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
Kt(qt, "setRef");
function Jt(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = qt(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : qt(e[t], null);
			}
		};
	};
}
Kt(Jt, "composeRefs");
function Yt(...e) {
	return _.useCallback(Jt(...e), e);
}
Kt(Yt, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-slot/dist/index.mjs
var Xt = /* @__PURE__ */ c(m(), 1), Zt = Object.defineProperty, Qt = (e, t) => Zt(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function $t(e) {
	let t = _.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		ln(r) && typeof pn == "function" && (r = pn(r._payload)), _.Children.forEach(r, (e) => {
			if (sn(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				ln(n) && typeof pn == "function" && (n = pn(n._payload)), a = rn(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = _.cloneElement(a, void 0, s) : !o && _.Children.count(r) === 1 && _.isValidElement(r) && (a = r);
		let c = a ? on(a) : void 0, l = Yt(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? fn(e) : dn(e));
			return r;
		}
		let u = an(i, a.props ?? {});
		return a.type !== _.Fragment && (u.ref = n ? l : c), _.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
Qt($t, "createSlot");
var en = /* @__PURE__ */ $t("Slot"), tn = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function nn(e) {
	let t = /* @__PURE__ */ Qt((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = tn, t;
}
Qt(nn, "createSlottable");
var rn = /* @__PURE__ */ Qt((e, t) => {
	if ("child" in e.props) {
		let t = e.props.child;
		return _.isValidElement(t) ? _.cloneElement(t, void 0, e.props.children(t.props.children)) : null;
	}
	return _.isValidElement(t) ? t : null;
}, "getSlottableElementFromSlottable");
function an(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" && (n[r] = [i, a].filter(Boolean).join(" "));
	}
	return {
		...e,
		...n
	};
}
Qt(an, "mergeProps");
function on(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Qt(on, "getElementRef");
function sn(e) {
	return _.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === tn;
}
Qt(sn, "isSlottable");
var cn = Symbol.for("react.lazy");
function ln(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === cn && "_payload" in e && un(e._payload);
}
Qt(ln, "isLazyComponent");
function un(e) {
	return typeof e == "object" && !!e && "then" in e;
}
Qt(un, "isPromiseLike");
var dn = /* @__PURE__ */ Qt((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), fn = /* @__PURE__ */ Qt((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), pn = _.use, mn = Object.defineProperty, hn = (e, t) => mn(e, "name", {
	value: t,
	configurable: !0
}), gn = [
	"a",
	"button",
	"div",
	"form",
	"h2",
	"h3",
	"img",
	"input",
	"label",
	"li",
	"nav",
	"ol",
	"p",
	"select",
	"span",
	"svg",
	"ul"
].reduce((e, t) => {
	let n = /* @__PURE__ */ $t(`Primitive.${t}`), r = _.forwardRef((e, r) => {
		let { asChild: i, ...a } = e, o = i ? n : t;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, z.jsx)(o, {
			...a,
			ref: r
		});
	});
	return r.displayName = `Primitive.${t}`, {
		...e,
		[t]: r
	};
}, {});
function _n(e, t) {
	e && Xt.flushSync(() => e.dispatchEvent(t));
}
hn(_n, "dispatchDiscreteCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-context/dist/index.mjs
var vn = Object.defineProperty, yn = (e, t) => vn(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function bn(e, t) {
	let n = _.createContext(t);
	n.displayName = e + "Context";
	let r = /* @__PURE__ */ yn((e) => {
		let { children: t, ...r } = e, i = _.useMemo(() => r, Object.values(r));
		return /* @__PURE__ */ (0, z.jsx)(n.Provider, {
			value: i,
			children: t
		});
	}, "Provider");
	r.displayName = e + "Provider";
	function i(r, i = {}) {
		let { optional: a = !1 } = i, o = _.useContext(n);
		if (o) return o;
		if (t !== void 0) return t;
		if (!a) throw Error(`\`${r}\` must be used within \`${e}\``);
	}
	return yn(i, "useContext"), [r, i];
}
yn(bn, "createContext");
// @__NO_SIDE_EFFECTS__
function xn(e, t = []) {
	let n = [];
	function r(t, r) {
		let i = _.createContext(r);
		i.displayName = t + "Context";
		let a = n.length;
		n = [...n, r];
		let o = /* @__PURE__ */ yn((t) => {
			let { scope: n, children: r, ...o } = t, s = n?.[e]?.[a] || i, c = _.useMemo(() => o, Object.values(o));
			return /* @__PURE__ */ (0, z.jsx)(s.Provider, {
				value: c,
				children: r
			});
		}, "Provider");
		o.displayName = t + "Provider";
		function s(n, o, s = {}) {
			let { optional: c = !1 } = s, l = o?.[e]?.[a] || i, u = _.useContext(l);
			if (u) return u;
			if (r !== void 0) return r;
			if (!c) throw Error(`\`${n}\` must be used within \`${t}\``);
		}
		return yn(s, "useContext"), [o, s];
	}
	yn(r, "createContext");
	let i = /* @__PURE__ */ yn(() => {
		let t = n.map((e) => _.createContext(e));
		return /* @__PURE__ */ yn(function(n) {
			let r = n?.[e] || t;
			return _.useMemo(() => ({ [`__scope${e}`]: {
				...n,
				[e]: r
			} }), [n, r]);
		}, "useScope");
	}, "createScope");
	return i.scopeName = e, [r, Sn(i, ...t)];
}
yn(xn, "createContextScope");
function Sn(...e) {
	let t = e[0];
	if (e.length === 1) return t;
	let n = /* @__PURE__ */ yn(() => {
		let n = e.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return /* @__PURE__ */ yn(function(e) {
			let r = n.reduce((t, { useScope: n, scopeName: r }) => {
				let i = n(e)[`__scope${r}`];
				return {
					...t,
					...i
				};
			}, {});
			return _.useMemo(() => ({ [`__scope${t.scopeName}`]: r }), [r]);
		}, "useComposedScopes");
	}, "createScope");
	return n.scopeName = t.scopeName, n;
}
yn(Sn, "composeContextScopes");
//#endregion
//#region node_modules/@radix-ui/primitive/dist/index.mjs
var Cn = Object.defineProperty, wn = (e, t) => Cn(e, "name", {
	value: t,
	configurable: !0
}), Tn = !!(typeof window < "u" && window.document && window.document.createElement);
function En(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return /* @__PURE__ */ wn(function(r) {
		if (e?.(r), n === !1 || !r || !r.defaultPrevented) return t?.(r);
	}, "handleEvent");
}
wn(En, "composeEventHandlers");
function Dn(e) {
	if (!Tn) throw Error("Cannot access window outside of the DOM");
	return e?.ownerDocument?.defaultView ?? window;
}
wn(Dn, "getOwnerWindow");
function On(e) {
	if (!Tn) throw Error("Cannot access document outside of the DOM");
	return e?.ownerDocument ?? document;
}
wn(On, "getOwnerDocument");
function kn(e, t = !1) {
	let { activeElement: n } = On(e);
	if (!n?.nodeName) return null;
	if (An(n) && n.contentDocument) return kn(n.contentDocument.body, t);
	if (t) {
		let e = n.getAttribute("aria-activedescendant");
		if (e) {
			let t = On(n).getElementById(e);
			if (t) return t;
		}
	}
	return n;
}
wn(kn, "getActiveElement");
function An(e) {
	return e.tagName === "IFRAME";
}
wn(An, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var jn = globalThis?.document ? _.useLayoutEffect : () => {}, Mn = Object.defineProperty, Nn = (e, t) => Mn(e, "name", {
	value: t,
	configurable: !0
}), Pn = _.useEffectEvent, Fn = _.useInsertionEffect;
function In(e) {
	if (typeof Pn == "function") return Pn(e);
	let t = _.useRef(() => {
		throw Error("Cannot call an event handler while rendering.");
	});
	return typeof Fn == "function" ? Fn(() => {
		t.current = e;
	}) : jn(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
Nn(In, "useEffectEvent");
//#endregion
//#region node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var Ln = Object.defineProperty, Rn = (e, t) => Ln(e, "name", {
	value: t,
	configurable: !0
}), zn = _.useInsertionEffect || jn;
function Bn({ prop: e, defaultProp: t, onChange: n = /* @__PURE__ */ Rn(() => {}, "onChange"), caller: r }) {
	let [i, a, o] = Vn({
		defaultProp: t,
		onChange: n
	}), s = e !== void 0;
	return [s ? e : i, _.useCallback((t) => {
		if (s) {
			let n = Hn(t) ? t(e) : t;
			n !== e && o.current?.(n);
		} else a(t);
	}, [
		s,
		e,
		a,
		o
	])];
}
Rn(Bn, "useControllableState");
function Vn({ defaultProp: e, onChange: t }) {
	let [n, r] = _.useState(e), i = _.useRef(n), a = _.useRef(t);
	return zn(() => {
		a.current = t;
	}, [t]), _.useEffect(() => {
		i.current !== n && (a.current?.(n), i.current = n);
	}, [n, i]), [
		n,
		r,
		a
	];
}
Rn(Vn, "useUncontrolledState");
function Hn(e) {
	return typeof e == "function";
}
Rn(Hn, "isFunction");
var Un = Symbol("RADIX:SYNC_STATE");
function Wn(e, t, n, r) {
	let { prop: i, defaultProp: a, onChange: o, caller: s } = t, c = i !== void 0, l = In(o), u = [{
		...n,
		state: a
	}];
	r && u.push(r);
	let [d, f] = _.useReducer((t, n) => {
		if (n.type === Un) return {
			...t,
			state: n.state
		};
		let r = e(t, n);
		return c && !Object.is(r.state, t.state) && l(r.state), r;
	}, ...u), p = d.state, m = _.useRef(p);
	_.useEffect(() => {
		m.current !== p && (m.current = p, c || l(p));
	}, [
		p,
		m,
		c
	]);
	let h = _.useMemo(() => i === void 0 ? d : {
		...d,
		state: i
	}, [d, i]);
	return _.useEffect(() => {
		c && !Object.is(i, d.state) && f({
			type: Un,
			state: i
		});
	}, [
		i,
		d.state,
		c
	]), [h, f];
}
Rn(Wn, "useControllableStateReducer");
//#endregion
//#region node_modules/@radix-ui/react-presence/dist/index.mjs
var Gn = Object.defineProperty, Kn = (e, t) => Gn(e, "name", {
	value: t,
	configurable: !0
});
function qn(e, t) {
	return _.useReducer((e, n) => t[e][n] ?? e, e);
}
Kn(qn, "useStateMachine");
var Jn = /* @__PURE__ */ Kn((e) => {
	let { present: t, children: n } = e, r = Yn(t), i = typeof n == "function" ? n({ present: r.isPresent }) : _.Children.only(n), a = Zn(r.ref, $n(i));
	return typeof n == "function" || r.isPresent ? _.cloneElement(i, { ref: a }) : null;
}, "Presence");
function Yn(e) {
	let [t, n] = _.useState(), r = _.useRef(null), i = _.useRef(e), a = _.useRef("none"), o = _.useRef(void 0), [s, c] = qn(e ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	return _.useEffect(() => {
		s === "mounted" ? (a.current = o.current ?? Qn(r.current), o.current = void 0) : a.current = "none";
	}, [s]), jn(() => {
		let t = r.current, n = i.current;
		if (n !== e) {
			let r = a.current, s = Qn(t);
			e ? (o.current = s, c("MOUNT")) : s === "none" || t?.display === "none" ? c("UNMOUNT") : c(n && r !== s ? "ANIMATION_OUT" : "UNMOUNT"), i.current = e;
		}
	}, [e, c]), jn(() => {
		if (t) {
			let e, n = t.ownerDocument.defaultView ?? window, o = /* @__PURE__ */ Kn((a) => {
				let o = Qn(r.current).includes(CSS.escape(a.animationName));
				if (a.target === t && o && (c("ANIMATION_END"), !i.current)) {
					let r = t.style.animationFillMode;
					t.style.animationFillMode = "forwards", e = n.setTimeout(() => {
						t.style.animationFillMode === "forwards" && (t.style.animationFillMode = r);
					});
				}
			}, "handleAnimationEnd"), s = /* @__PURE__ */ Kn((e) => {
				e.target === t && (a.current = Qn(r.current));
			}, "handleAnimationStart");
			return t.addEventListener("animationstart", s), t.addEventListener("animationcancel", o), t.addEventListener("animationend", o), () => {
				n.clearTimeout(e), t.removeEventListener("animationstart", s), t.removeEventListener("animationcancel", o), t.removeEventListener("animationend", o);
			};
		}
		c("ANIMATION_END");
	}, [t, c]), {
		isPresent: ["mounted", "unmountSuspended"].includes(s),
		ref: _.useCallback((e) => {
			if (e) {
				let t = getComputedStyle(e);
				r.current = t, o.current = Qn(t);
			} else r.current = null;
			n(e);
		}, [])
	};
}
Kn(Yn, "usePresence");
function Xn(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
Kn(Xn, "setRef");
function Zn(...e) {
	let t = _.useRef(e);
	return t.current = e, _.useCallback((e) => {
		let n = t.current, r = !1, i = n.map((t) => {
			let n = Xn(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				typeof t == "function" ? t() : Xn(n[e], null);
			}
		};
	}, []);
}
Kn(Zn, "useStableComposedRefs");
function Qn(e) {
	return e?.animationName || "none";
}
Kn(Qn, "getAnimationName");
function $n(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Kn($n, "getElementRef");
//#endregion
//#region node_modules/@radix-ui/react-id/dist/index.mjs
var er = Object.defineProperty, tr = (e, t) => er(e, "name", {
	value: t,
	configurable: !0
}), nr = _.useId || (() => void 0), rr = 0;
function ir(e) {
	let [t, n] = _.useState(nr());
	return jn(() => {
		e || n((e) => e ?? String(rr++));
	}, [e]), e || (t ? `radix-${t}` : "");
}
tr(ir, "useId");
//#endregion
//#region node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var ar = Object.defineProperty, or = (e, t) => ar(e, "name", {
	value: t,
	configurable: !0
});
function sr(e) {
	let t = _.useRef(e);
	return _.useEffect(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
or(sr, "useCallbackRef");
//#endregion
//#region node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var cr = Object.defineProperty, lr = (e, t) => cr(e, "name", {
	value: t,
	configurable: !0
}), ur = "dismissableLayer.update", dr = "dismissableLayer.pointerDownOutside", fr = "dismissableLayer.focusOutside", pr, mr = _.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set(),
	dismissableSurfaces: /* @__PURE__ */ new Set()
}), hr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ lr(function(e, t) {
	let { disableOutsidePointerEvents: n = !1, deferPointerDownOutside: r = !1, onEscapeKeyDown: i, onPointerDownOutside: a, onFocusOutside: o, onInteractOutside: s, onDismiss: c, ...l } = e, u = _.useContext(mr), [d, f] = _.useState(null), p = d?.ownerDocument ?? globalThis?.document, [, m] = _.useState({}), h = Yt(t, f), g = Array.from(u.layers), [v] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), y = v ? g.indexOf(v) : -1, b = d ? g.indexOf(d) : -1, x = u.layersWithOutsidePointerEventsDisabled.size > 0, S = b >= y, C = _.useRef(!1), w = vr((e) => {
		a?.(e), s?.(e), e.defaultPrevented || c?.();
	}, {
		ownerDocument: p,
		deferPointerDownOutside: r,
		isDeferredPointerDownOutsideRef: C,
		dismissableSurfaces: u.dismissableSurfaces,
		shouldHandlePointerDownOutside: _.useCallback((e) => {
			if (!(e instanceof Node)) return !1;
			let t = [...u.branches].some((t) => t.contains(e));
			return S && !t;
		}, [u.branches, S])
	}), T = yr((e) => {
		if (r && C.current) return;
		let t = e.target;
		[...u.branches].some((e) => e.contains(t)) || (o?.(e), s?.(e), e.defaultPrevented || c?.());
	}, p), ee = d ? b === g.length - 1 : !1, te = sr((e) => {
		e.key === "Escape" && (i?.(e), !e.defaultPrevented && c && (e.preventDefault(), c()));
	});
	return _.useEffect(() => {
		if (ee) return p.addEventListener("keydown", te, { capture: !0 }), () => p.removeEventListener("keydown", te, { capture: !0 });
	}, [
		p,
		ee,
		te
	]), _.useEffect(() => {
		if (d) return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (pr = p.body.style.pointerEvents, p.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(d)), u.layers.add(d), br(), () => {
			n && (u.layersWithOutsidePointerEventsDisabled.delete(d), u.layersWithOutsidePointerEventsDisabled.size === 0 && (p.body.style.pointerEvents = pr));
		};
	}, [
		d,
		p,
		n,
		u
	]), _.useEffect(() => () => {
		d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), br());
	}, [d, u]), _.useEffect(() => {
		let e = /* @__PURE__ */ lr(() => m({}), "handleUpdate");
		return document.addEventListener(ur, e), () => document.removeEventListener(ur, e);
	}, []), /* @__PURE__ */ (0, z.jsx)(gn.div, {
		...l,
		ref: h,
		style: {
			pointerEvents: x ? S ? "auto" : "none" : void 0,
			...e.style
		},
		onFocusCapture: En(e.onFocusCapture, T.onFocusCapture),
		onBlurCapture: En(e.onBlurCapture, T.onBlurCapture),
		onPointerDownCapture: En(e.onPointerDownCapture, w.onPointerDownCapture)
	});
}, "DismissableLayer"));
function gr() {
	let e = _.useContext(mr), [t, n] = _.useState(null);
	return _.useEffect(() => {
		if (t) return e.dismissableSurfaces.add(t), () => {
			e.dismissableSurfaces.delete(t);
		};
	}, [t, e.dismissableSurfaces]), n;
}
lr(gr, "useDismissableLayerSurface");
var _r = /* @__PURE__ */ lr(() => !0, "IS_TRUE");
function vr(e, t) {
	let { ownerDocument: n = globalThis?.document, deferPointerDownOutside: r = !1, isDeferredPointerDownOutsideRef: i, dismissableSurfaces: a, shouldHandlePointerDownOutside: o = _r } = t, s = sr(e), c = _.useRef(!1), l = _.useRef(!1), u = _.useRef(/* @__PURE__ */ new Map()), d = _.useRef(() => {});
	return _.useEffect(() => {
		function e() {
			l.current = !1, i.current = !1, u.current.clear();
		}
		lr(e, "resetOutsideInteraction");
		function t() {
			return Array.from(u.current.values()).some(Boolean);
		}
		lr(t, "isOutsideInteractionIntercepted");
		function f(e) {
			if (!l.current) return;
			let t = e.target;
			t instanceof Node && [...a].some((e) => e.contains(t)) || u.current.set(e.type, !0), e.type === "click" && window.setTimeout(() => {
				l.current && d.current();
			}, 0);
		}
		lr(f, "handleInteractionCapture");
		function p(e) {
			l.current && u.current.set(e.type, !1);
		}
		lr(p, "handleInteractionBubble");
		let m = /* @__PURE__ */ lr((a) => {
			if (a.target && !c.current) {
				let f = function() {
					n.removeEventListener("click", d.current);
					let r = t();
					e(), r || xr(dr, s, p, { discrete: !0 });
				};
				if (lr(f, "handleAndDispatchPointerDownOutsideEvent"), !o(a.target)) {
					n.removeEventListener("click", d.current), e(), c.current = !1;
					return;
				}
				let p = { originalEvent: a };
				l.current = !0, i.current = r && a.button === 0, u.current.clear(), !r || a.button !== 0 ? f() : (n.removeEventListener("click", d.current), d.current = f, n.addEventListener("click", d.current, { once: !0 }));
			} else n.removeEventListener("click", d.current), e();
			c.current = !1;
		}, "handlePointerDown"), h = [
			"pointerup",
			"mousedown",
			"mouseup",
			"touchstart",
			"touchend",
			"click"
		];
		for (let e of h) n.addEventListener(e, f, !0), n.addEventListener(e, p);
		let g = window.setTimeout(() => {
			n.addEventListener("pointerdown", m);
		}, 0);
		return () => {
			window.clearTimeout(g), n.removeEventListener("pointerdown", m), n.removeEventListener("click", d.current);
			for (let e of h) n.removeEventListener(e, f, !0), n.removeEventListener(e, p);
		};
	}, [
		n,
		s,
		r,
		i,
		a,
		o
	]), { onPointerDownCapture: /* @__PURE__ */ lr(() => c.current = !0, "onPointerDownCapture") };
}
lr(vr, "usePointerDownOutside");
function yr(e, t = globalThis?.document) {
	let n = sr(e), r = _.useRef(!1);
	return _.useEffect(() => {
		let e = /* @__PURE__ */ lr((e) => {
			e.target && !r.current && xr(fr, n, { originalEvent: e }, { discrete: !1 });
		}, "handleFocus");
		return t.addEventListener("focusin", e), () => t.removeEventListener("focusin", e);
	}, [t, n]), {
		onFocusCapture: /* @__PURE__ */ lr(() => r.current = !0, "onFocusCapture"),
		onBlurCapture: /* @__PURE__ */ lr(() => r.current = !1, "onBlurCapture")
	};
}
lr(yr, "useFocusOutside");
function br() {
	let e = new CustomEvent(ur);
	document.dispatchEvent(e);
}
lr(br, "dispatchUpdate");
function xr(e, t, n, { discrete: r }) {
	let i = n.originalEvent.target, a = new CustomEvent(e, {
		bubbles: !1,
		cancelable: !0,
		detail: n
	});
	t && i.addEventListener(e, t, { once: !0 }), r ? _n(i, a) : i.dispatchEvent(a);
}
lr(xr, "handleAndDispatchCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var Sr = Object.defineProperty, Cr = (e, t) => Sr(e, "name", {
	value: t,
	configurable: !0
}), wr = "focusScope.autoFocusOnMount", Tr = "focusScope.autoFocusOnUnmount", Er = {
	bubbles: !1,
	cancelable: !0
}, Dr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Cr(function(e, t) {
	let { loop: n = !1, trapped: r = !1, onMountAutoFocus: i, onUnmountAutoFocus: a, ...o } = e, [s, c] = _.useState(null), l = sr(i), u = sr(a), d = _.useRef(null), f = Yt(t, c), p = _.useRef({
		paused: !1,
		pause() {
			this.paused = !0;
		},
		resume() {
			this.paused = !1;
		}
	}).current;
	_.useEffect(() => {
		if (r) {
			let e = function(e) {
				if (p.paused || !s) return;
				let t = e.target;
				s.contains(t) ? d.current = t : Pr(d.current, { select: !0 });
			}, t = function(e) {
				if (p.paused || !s) return;
				let t = e.relatedTarget;
				t !== null && (s.contains(t) || Pr(d.current, { select: !0 }));
			}, n = function(e) {
				if (document.activeElement === document.body) for (let t of e) t.removedNodes.length > 0 && Pr(s);
			};
			Cr(e, "handleFocusIn"), Cr(t, "handleFocusOut"), Cr(n, "handleMutations"), document.addEventListener("focusin", e), document.addEventListener("focusout", t);
			let r = new MutationObserver(n);
			return s && r.observe(s, {
				childList: !0,
				subtree: !0
			}), () => {
				document.removeEventListener("focusin", e), document.removeEventListener("focusout", t), r.disconnect();
			};
		}
	}, [
		r,
		s,
		p.paused
	]), _.useEffect(() => {
		if (s) {
			Fr.add(p);
			let e = document.activeElement;
			if (!s.contains(e)) {
				let t = new CustomEvent(wr, Er);
				s.addEventListener(wr, l), s.dispatchEvent(t), t.defaultPrevented || (Or(Rr(Ar(s)), { select: !0 }), document.activeElement === e && Pr(s));
			}
			return () => {
				s.removeEventListener(wr, l), setTimeout(() => {
					let t = new CustomEvent(Tr, Er);
					s.addEventListener(Tr, u), s.dispatchEvent(t), t.defaultPrevented || Pr(e ?? document.body, { select: !0 }), s.removeEventListener(Tr, u), Fr.remove(p);
				}, 0);
			};
		}
	}, [
		s,
		l,
		u,
		p
	]);
	let m = _.useCallback((e) => {
		if (!n && !r || p.paused) return;
		let t = e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey, i = document.activeElement;
		if (t && i) {
			let t = e.currentTarget, [r, a] = kr(t);
			r && a ? !e.shiftKey && i === a ? (e.preventDefault(), n && Pr(r, { select: !0 })) : e.shiftKey && i === r && (e.preventDefault(), n && Pr(a, { select: !0 })) : i === t && e.preventDefault();
		}
	}, [
		n,
		r,
		p.paused
	]);
	return /* @__PURE__ */ (0, z.jsx)(gn.div, {
		tabIndex: -1,
		...o,
		ref: f,
		onKeyDown: m
	});
}, "FocusScope"));
function Or(e, { select: t = !1 } = {}) {
	let n = document.activeElement;
	for (let r of e) if (Pr(r, { select: t }), document.activeElement !== n) return;
}
Cr(Or, "focusFirst");
function kr(e) {
	let t = Ar(e);
	return [jr(t, e), jr(t.reverse(), e)];
}
Cr(kr, "getTabbableEdges");
function Ar(e) {
	let t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: /* @__PURE__ */ Cr((e) => {
		let t = e.tagName === "INPUT" && e.type === "hidden";
		return e.disabled || e.hidden || t ? NodeFilter.FILTER_SKIP : e.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	}, "acceptNode") });
	for (; n.nextNode();) t.push(n.currentNode);
	return t;
}
Cr(Ar, "getTabbableCandidates");
function jr(e, t) {
	let n = typeof t.checkVisibility == "function" && t.checkVisibility({ checkVisibilityCSS: !0 });
	for (let r of e) if (!(n ? !r.checkVisibility({ checkVisibilityCSS: !0 }) : Mr(r, { upTo: t }))) return r;
}
Cr(jr, "findVisible");
function Mr(e, { upTo: t }) {
	if (getComputedStyle(e).visibility === "hidden") return !0;
	for (; e;) {
		if (t !== void 0 && e === t) return !1;
		if (getComputedStyle(e).display === "none") return !0;
		e = e.parentElement;
	}
	return !1;
}
Cr(Mr, "isHidden");
function Nr(e) {
	return e instanceof HTMLInputElement && "select" in e;
}
Cr(Nr, "isSelectableInput");
function Pr(e, { select: t = !1 } = {}) {
	if (e && e.focus) {
		let n = document.activeElement;
		e.focus({ preventScroll: !0 }), e !== n && Nr(e) && t && e.select();
	}
}
Cr(Pr, "focus");
var Fr = Ir();
function Ir() {
	let e = [];
	return {
		add(t) {
			let n = e[0];
			t !== n && n?.pause(), e = Lr(e, t), e.unshift(t);
		},
		remove(t) {
			e = Lr(e, t), e[0]?.resume();
		}
	};
}
Cr(Ir, "createFocusScopesStack");
function Lr(e, t) {
	let n = [...e], r = n.indexOf(t);
	return r !== -1 && n.splice(r, 1), n;
}
Cr(Lr, "arrayRemove");
function Rr(e) {
	return e.filter((e) => e.tagName !== "A");
}
Cr(Rr, "removeLinks");
//#endregion
//#region node_modules/@radix-ui/react-portal/dist/index.mjs
var zr = Object.defineProperty, Br = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ((e, t) => zr(e, "name", {
	value: t,
	configurable: !0
}))(function(e, t) {
	let { container: n, ...r } = e, [i, a] = _.useState(!1);
	jn(() => a(!0), []);
	let o = n || i && globalThis?.document?.body;
	return o ? Xt.createPortal(/* @__PURE__ */ (0, z.jsx)(gn.div, {
		...r,
		ref: t
	}), o) : null;
}, "Portal")), Vr = Object.defineProperty, Hr = (e, t) => Vr(e, "name", {
	value: t,
	configurable: !0
}), Ur = 0, Wr = null;
function Gr(e) {
	return Kr(), e.children;
}
Hr(Gr, "FocusGuards");
function Kr() {
	_.useEffect(() => {
		Wr ||= {
			start: qr(),
			end: qr()
		};
		let { start: e, end: t } = Wr;
		return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), Ur++, () => {
			Ur === 1 && (Wr?.start.remove(), Wr?.end.remove(), Wr = null), Ur = Math.max(0, Ur - 1);
		};
	}, []);
}
Hr(Kr, "useFocusGuards");
function qr() {
	let e = document.createElement("span");
	return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
Hr(qr, "createFocusGuard");
//#endregion
//#region node_modules/tslib/tslib.es6.mjs
var Jr = function() {
	return Jr = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Jr.apply(this, arguments);
};
function Yr(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function Xr(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var Zr = "right-scroll-bar-position", Qr = "width-before-scroll-bar", $r = "with-scroll-bars-hidden", ei = "--removed-body-scroll-bar-size";
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/assignRef.js
function ti(e, t) {
	return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/useRef.js
function ni(e, t) {
	var n = (0, _.useState)(function() {
		return {
			value: e,
			callback: t,
			facade: {
				get current() {
					return n.value;
				},
				set current(e) {
					var t = n.value;
					t !== e && (n.value = e, n.callback(e, t));
				}
			}
		};
	})[0];
	return n.callback = t, n.facade;
}
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/useMergeRef.js
var ri = typeof window < "u" ? _.useLayoutEffect : _.useEffect, ii = /* @__PURE__ */ new WeakMap();
function ai(e, t) {
	var n = ni(t || null, function(t) {
		return e.forEach(function(e) {
			return ti(e, t);
		});
	});
	return ri(function() {
		var t = ii.get(n);
		if (t) {
			var r = new Set(t), i = new Set(e), a = n.current;
			r.forEach(function(e) {
				i.has(e) || ti(e, null);
			}), i.forEach(function(e) {
				r.has(e) || ti(e, a);
			});
		}
		ii.set(n, e);
	}, [e]), n;
}
//#endregion
//#region node_modules/use-sidecar/dist/es2015/medium.js
function oi(e) {
	return e;
}
function si(e, t) {
	t === void 0 && (t = oi);
	var n = [], r = !1;
	return {
		read: function() {
			if (r) throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
			return n.length ? n[n.length - 1] : e;
		},
		useMedium: function(e) {
			var i = t(e, r);
			return n.push(i), function() {
				n = n.filter(function(e) {
					return e !== i;
				});
			};
		},
		assignSyncMedium: function(e) {
			for (r = !0; n.length;) {
				var t = n;
				n = [], t.forEach(e);
			}
			n = {
				push: function(t) {
					return e(t);
				},
				filter: function() {
					return n;
				}
			};
		},
		assignMedium: function(e) {
			r = !0;
			var t = [];
			if (n.length) {
				var i = n;
				n = [], i.forEach(e), t = n;
			}
			var a = function() {
				var n = t;
				t = [], n.forEach(e);
			}, o = function() {
				return Promise.resolve().then(a);
			};
			o(), n = {
				push: function(e) {
					t.push(e), o();
				},
				filter: function(e) {
					return t = t.filter(e), n;
				}
			};
		}
	};
}
function ci(e) {
	e === void 0 && (e = {});
	var t = si(null);
	return t.options = Jr({
		async: !0,
		ssr: !1
	}, e), t;
}
//#endregion
//#region node_modules/use-sidecar/dist/es2015/exports.js
var li = function(e) {
	var t = e.sideCar, n = Yr(e, ["sideCar"]);
	if (!t) throw Error("Sidecar: please provide `sideCar` property to import the right car");
	var r = t.read();
	if (!r) throw Error("Sidecar medium not found");
	return _.createElement(r, Jr({}, n));
};
li.isSideCarExport = !0;
function ui(e, t) {
	return e.useMedium(t), li;
}
//#endregion
//#region node_modules/react-remove-scroll/dist/es2015/medium.js
var di = ci(), fi = function() {}, pi = _.forwardRef(function(e, t) {
	var n = _.useRef(null), r = _.useState({
		onScrollCapture: fi,
		onWheelCapture: fi,
		onTouchMoveCapture: fi
	}), i = r[0], a = r[1], o = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, g = e.allowPinchZoom, v = e.as, y = v === void 0 ? "div" : v, b = e.gapMode, x = Yr(e, [
		"forwardProps",
		"children",
		"className",
		"removeScrollBar",
		"enabled",
		"shards",
		"sideCar",
		"noRelative",
		"noIsolation",
		"inert",
		"allowPinchZoom",
		"as",
		"gapMode"
	]), S = f, C = ai([n, t]), w = Jr(Jr({}, x), i);
	return _.createElement(_.Fragment, null, u && _.createElement(S, {
		sideCar: di,
		removeScrollBar: l,
		shards: d,
		noRelative: p,
		noIsolation: m,
		inert: h,
		setCallbacks: a,
		allowPinchZoom: !!g,
		lockRef: n,
		gapMode: b
	}), o ? _.cloneElement(_.Children.only(s), Jr(Jr({}, w), { ref: C })) : _.createElement(y, Jr({}, w, {
		className: c,
		ref: C
	}), s));
});
pi.defaultProps = {
	enabled: !0,
	removeScrollBar: !0,
	inert: !1
}, pi.classNames = {
	fullWidth: Qr,
	zeroRight: Zr
};
//#endregion
//#region node_modules/get-nonce/dist/es2015/index.js
var mi, hi = function() {
	if (mi) return mi;
	if (typeof __webpack_nonce__ < "u") return __webpack_nonce__;
};
//#endregion
//#region node_modules/react-style-singleton/dist/es2015/singleton.js
function gi() {
	if (!document) return null;
	var e = document.createElement("style");
	e.type = "text/css";
	var t = hi();
	return t && e.setAttribute("nonce", t), e;
}
function _i(e, t) {
	e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function vi(e) {
	(document.head || document.getElementsByTagName("head")[0]).appendChild(e);
}
var yi = function() {
	var e = 0, t = null;
	return {
		add: function(n) {
			e == 0 && (t = gi()) && (_i(t, n), vi(t)), e++;
		},
		remove: function() {
			e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
		}
	};
}, bi = function() {
	var e = yi();
	return function(t, n) {
		_.useEffect(function() {
			return e.add(t), function() {
				e.remove();
			};
		}, [t && n]);
	};
}, xi = function() {
	var e = bi();
	return function(t) {
		var n = t.styles, r = t.dynamic;
		return e(n, r), null;
	};
}, Si = {
	left: 0,
	top: 0,
	right: 0,
	gap: 0
}, Ci = function(e) {
	return parseInt(e || "", 10) || 0;
}, wi = function(e) {
	var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], i = t[e === "padding" ? "paddingRight" : "marginRight"];
	return [
		Ci(n),
		Ci(r),
		Ci(i)
	];
}, Ti = function(e) {
	if (e === void 0 && (e = "margin"), typeof window > "u") return Si;
	var t = wi(e), n = document.documentElement.clientWidth, r = window.innerWidth;
	return {
		left: t[0],
		top: t[1],
		right: t[2],
		gap: Math.max(0, r - n + t[2] - t[0])
	};
}, Ei = xi(), Di = "data-scroll-locked", Oi = function(e, t, n, r) {
	var i = e.left, a = e.top, o = e.right, s = e.gap;
	return n === void 0 && (n = "margin"), `
  .${$r} {
   overflow: hidden ${r};
   padding-right: ${s}px ${r};
  }
  body[${Di}] {
    overflow: hidden ${r};
    overscroll-behavior: contain;
    ${[
		t && `position: relative ${r};`,
		n === "margin" && `
    padding-left: ${i}px;
    padding-top: ${a}px;
    padding-right: ${o}px;
    margin-left:0;
    margin-top:0;
    margin-right: ${s}px ${r};
    `,
		n === "padding" && `padding-right: ${s}px ${r};`
	].filter(Boolean).join("")}
  }
  
  .${Zr} {
    right: ${s}px ${r};
  }
  
  .${Qr} {
    margin-right: ${s}px ${r};
  }
  
  .${Zr} .${Zr} {
    right: 0 ${r};
  }
  
  .${Qr} .${Qr} {
    margin-right: 0 ${r};
  }
  
  body[${Di}] {
    ${ei}: ${s}px;
  }
`;
}, ki = function() {
	var e = parseInt(document.body.getAttribute("data-scroll-locked") || "0", 10);
	return isFinite(e) ? e : 0;
}, Ai = function() {
	_.useEffect(function() {
		return document.body.setAttribute(Di, (ki() + 1).toString()), function() {
			var e = ki() - 1;
			e <= 0 ? document.body.removeAttribute(Di) : document.body.setAttribute(Di, e.toString());
		};
	}, []);
}, ji = function(e) {
	var t = e.noRelative, n = e.noImportant, r = e.gapMode, i = r === void 0 ? "margin" : r;
	Ai();
	var a = _.useMemo(function() {
		return Ti(i);
	}, [i]);
	return _.createElement(Ei, { styles: Oi(a, !t, i, n ? "" : "!important") });
}, Mi = !1;
if (typeof window < "u") try {
	var B = Object.defineProperty({}, "passive", { get: function() {
		return Mi = !0, !0;
	} });
	window.addEventListener("test", B, B), window.removeEventListener("test", B, B);
} catch {
	Mi = !1;
}
var V = Mi ? { passive: !1 } : !1, Ni = function(e) {
	return e.tagName === "TEXTAREA";
}, Pi = function(e, t) {
	if (!(e instanceof Element)) return !1;
	var n = window.getComputedStyle(e);
	return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !Ni(e) && n[t] === "visible");
}, Fi = function(e) {
	return Pi(e, "overflowY");
}, Ii = function(e) {
	return Pi(e, "overflowX");
}, Li = function(e, t) {
	var n = t.ownerDocument, r = t;
	do {
		if (typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host), Bi(e, r)) {
			var i = Vi(e, r);
			if (i[1] > i[2]) return !0;
		}
		r = r.parentNode;
	} while (r && r !== n.body);
	return !1;
}, Ri = function(e) {
	return [
		e.scrollTop,
		e.scrollHeight,
		e.clientHeight
	];
}, zi = function(e) {
	return [
		e.scrollLeft,
		e.scrollWidth,
		e.clientWidth
	];
}, Bi = function(e, t) {
	return e === "v" ? Fi(t) : Ii(t);
}, Vi = function(e, t) {
	return e === "v" ? Ri(t) : zi(t);
}, Hi = function(e, t) {
	return e === "h" && t === "rtl" ? -1 : 1;
}, Ui = function(e, t, n, r, i) {
	var a = Hi(e, window.getComputedStyle(t).direction), o = a * r, s = n.target, c = t.contains(s), l = !1, u = o > 0, d = 0, f = 0;
	do {
		if (!s) break;
		var p = Vi(e, s), m = p[0], h = p[1] - p[2] - a * m;
		(m || h) && Bi(e, s) && (d += h, f += m);
		var g = s.parentNode;
		s = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
	} while (!c && s !== document.body || c && (t.contains(s) || t === s));
	return (u && (i && Math.abs(d) < 1 || !i && o > d) || !u && (i && Math.abs(f) < 1 || !i && -o > f)) && (l = !0), l;
}, Wi = function(e) {
	return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Gi = function(e) {
	return [e.deltaX, e.deltaY];
}, Ki = function(e) {
	return e && "current" in e ? e.current : e;
}, qi = function(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}, Ji = function(e) {
	return `
  .block-interactivity-${e} {pointer-events: none;}
  .allow-interactivity-${e} {pointer-events: all;}
`;
}, Yi = 0, Xi = [];
function Zi(e) {
	var t = _.useRef([]), n = _.useRef([0, 0]), r = _.useRef(), i = _.useState(Yi++)[0], a = _.useState(xi)[0], o = _.useRef(e);
	_.useEffect(function() {
		o.current = e;
	}, [e]), _.useEffect(function() {
		if (e.inert) {
			document.body.classList.add(`block-interactivity-${i}`);
			var t = Xr([e.lockRef.current], (e.shards || []).map(Ki), !0).filter(Boolean);
			return t.forEach(function(e) {
				return e.classList.add(`allow-interactivity-${i}`);
			}), function() {
				document.body.classList.remove(`block-interactivity-${i}`), t.forEach(function(e) {
					return e.classList.remove(`allow-interactivity-${i}`);
				});
			};
		}
	}, [
		e.inert,
		e.lockRef.current,
		e.shards
	]);
	var s = _.useCallback(function(e, t) {
		if ("touches" in e && e.touches.length === 2 || e.type === "wheel" && e.ctrlKey) return !o.current.allowPinchZoom;
		var i = Wi(e), a = n.current, s = "deltaX" in e ? e.deltaX : a[0] - i[0], c = "deltaY" in e ? e.deltaY : a[1] - i[1], l, u = e.target, d = Math.abs(s) > Math.abs(c) ? "h" : "v";
		if ("touches" in e && d === "h" && u.type === "range") return !1;
		var f = window.getSelection(), p = f && f.anchorNode;
		if (p && (p === u || p.contains(u))) return !1;
		var m = Li(d, u);
		if (!m) return !0;
		if (m ? l = d : (l = d === "v" ? "h" : "v", m = Li(d, u)), !m) return !1;
		if (!r.current && "changedTouches" in e && (s || c) && (r.current = l), !l) return !0;
		var h = r.current || l;
		return Ui(h, t, e, h === "h" ? s : c, !0);
	}, []), c = _.useCallback(function(e) {
		var n = e;
		if (!(!Xi.length || Xi[Xi.length - 1] !== a)) {
			var r = "deltaY" in n ? Gi(n) : Wi(n), i = t.current.filter(function(e) {
				return e.name === n.type && (e.target === n.target || n.target === e.shadowParent) && qi(e.delta, r);
			})[0];
			if (i && i.should) {
				n.cancelable && n.preventDefault();
				return;
			}
			if (!i) {
				var c = (o.current.shards || []).map(Ki).filter(Boolean).filter(function(e) {
					return e.contains(n.target);
				});
				(c.length > 0 ? s(n, c[0]) : !o.current.noIsolation) && n.cancelable && n.preventDefault();
			}
		}
	}, []), l = _.useCallback(function(e, n, r, i) {
		var a = {
			name: e,
			delta: n,
			target: r,
			should: i,
			shadowParent: Qi(r)
		};
		t.current.push(a), setTimeout(function() {
			t.current = t.current.filter(function(e) {
				return e !== a;
			});
		}, 1);
	}, []), u = _.useCallback(function(e) {
		n.current = Wi(e), r.current = void 0;
	}, []), d = _.useCallback(function(t) {
		l(t.type, Gi(t), t.target, s(t, e.lockRef.current));
	}, []), f = _.useCallback(function(t) {
		l(t.type, Wi(t), t.target, s(t, e.lockRef.current));
	}, []);
	_.useEffect(function() {
		return Xi.push(a), e.setCallbacks({
			onScrollCapture: d,
			onWheelCapture: d,
			onTouchMoveCapture: f
		}), document.addEventListener("wheel", c, V), document.addEventListener("touchmove", c, V), document.addEventListener("touchstart", u, V), function() {
			Xi = Xi.filter(function(e) {
				return e !== a;
			}), document.removeEventListener("wheel", c, V), document.removeEventListener("touchmove", c, V), document.removeEventListener("touchstart", u, V);
		};
	}, []);
	var p = e.removeScrollBar, m = e.inert;
	return _.createElement(_.Fragment, null, m ? _.createElement(a, { styles: Ji(i) }) : null, p ? _.createElement(ji, {
		noRelative: e.noRelative,
		gapMode: e.gapMode
	}) : null);
}
function Qi(e) {
	for (var t = null; e !== null;) e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
	return t;
}
//#endregion
//#region node_modules/react-remove-scroll/dist/es2015/sidecar.js
var $i = ui(di, Zi), ea = _.forwardRef(function(e, t) {
	return _.createElement(pi, Jr({}, e, {
		ref: t,
		sideCar: $i
	}));
});
ea.classNames = pi.classNames;
//#endregion
//#region node_modules/aria-hidden/dist/es2015/index.js
var ta = function(e) {
	return typeof document > "u" ? null : (Array.isArray(e) ? e[0] : e).ownerDocument.body;
}, na = /* @__PURE__ */ new WeakMap(), ra = /* @__PURE__ */ new WeakMap(), ia = {}, aa = 0, oa = function(e) {
	return e && (e.host || oa(e.parentNode));
}, sa = function(e, t) {
	return t.map(function(t) {
		if (e.contains(t)) return t;
		var n = oa(t);
		return n && e.contains(n) ? n : (console.error("aria-hidden", t, "in not contained inside", e, ". Doing nothing"), null);
	}).filter(function(e) {
		return !!e;
	});
}, ca = function(e, t, n, r) {
	var i = sa(t, Array.isArray(e) ? e : [e]);
	ia[n] || (ia[n] = /* @__PURE__ */ new WeakMap());
	var a = ia[n], o = [], s = /* @__PURE__ */ new Set(), c = new Set(i), l = function(e) {
		!e || s.has(e) || (s.add(e), l(e.parentNode));
	};
	i.forEach(l);
	var u = function(e) {
		!e || c.has(e) || Array.prototype.forEach.call(e.children, function(e) {
			if (s.has(e)) u(e);
			else try {
				var t = e.getAttribute(r), i = t !== null && t !== "false", c = (na.get(e) || 0) + 1, l = (a.get(e) || 0) + 1;
				na.set(e, c), a.set(e, l), o.push(e), c === 1 && i && ra.set(e, !0), l === 1 && e.setAttribute(n, "true"), i || e.setAttribute(r, "true");
			} catch (t) {
				console.error("aria-hidden: cannot operate on ", e, t);
			}
		});
	};
	return u(t), s.clear(), aa++, function() {
		o.forEach(function(e) {
			var t = na.get(e) - 1, i = a.get(e) - 1;
			na.set(e, t), a.set(e, i), t || (ra.has(e) || e.removeAttribute(r), ra.delete(e)), i || e.removeAttribute(n);
		}), aa--, aa || (na = /* @__PURE__ */ new WeakMap(), na = /* @__PURE__ */ new WeakMap(), ra = /* @__PURE__ */ new WeakMap(), ia = {});
	};
}, la = function(e, t, n) {
	n === void 0 && (n = "data-aria-hidden");
	var r = Array.from(Array.isArray(e) ? e : [e]), i = t || ta(e);
	return i ? (r.push.apply(r, Array.from(i.querySelectorAll("[aria-live], script"))), ca(r, i, n, "aria-hidden")) : function() {
		return null;
	};
}, ua = Object.defineProperty, da = (e, t) => ua(e, "name", {
	value: t,
	configurable: !0
}), fa = "Dialog", [pa, ma] = /* @__PURE__ */ xn(fa), [ha, ga] = pa(fa), _a = /* @__PURE__ */ da((e) => {
	let { __scopeDialog: t, children: n, open: r, defaultOpen: i, onOpenChange: a, modal: o = !0 } = e, s = _.useRef(null), c = _.useRef(null), [l, u] = Bn({
		prop: r,
		defaultProp: i ?? !1,
		onChange: a,
		caller: fa
	}), [d, f] = _.useState(0), [p, m] = _.useState(0);
	return /* @__PURE__ */ (0, z.jsx)(ha, {
		scope: t,
		triggerRef: s,
		contentRef: c,
		contentId: ir(),
		titleId: ir(),
		descriptionId: ir(),
		titlePresent: d > 0,
		descriptionPresent: p > 0,
		setTitleCount: f,
		setDescriptionCount: m,
		open: l,
		onOpenChange: u,
		onOpenToggle: _.useCallback(() => u((e) => !e), [u]),
		modal: o,
		children: n
	});
}, "Dialog"), va = "DialogPortal", [ya, ba] = pa(va, { forceMount: void 0 }), xa = /* @__PURE__ */ da((e) => {
	let { __scopeDialog: t, forceMount: n, children: r, container: i } = e, a = ga(va, t);
	return /* @__PURE__ */ (0, z.jsx)(ya, {
		scope: t,
		forceMount: n,
		children: _.Children.map(r, (e) => /* @__PURE__ */ (0, z.jsx)(Jn, {
			present: n || a.open,
			children: /* @__PURE__ */ (0, z.jsx)(Br, {
				asChild: !0,
				container: i,
				children: e
			})
		}))
	});
}, "DialogPortal"), Sa = "DialogOverlay", Ca = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ba(Sa, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = ga(Sa, e.__scopeDialog);
	return a.modal ? /* @__PURE__ */ (0, z.jsx)(Jn, {
		present: r || a.open,
		children: /* @__PURE__ */ (0, z.jsx)(Ta, {
			...i,
			ref: t
		})
	}) : null;
}, "DialogOverlay")), wa = /* @__PURE__ */ $t("DialogOverlay.RemoveScroll"), Ta = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(Sa, n), a = Yt(t, gr());
	return /* @__PURE__ */ (0, z.jsx)(ea, {
		as: wa,
		allowPinchZoom: !0,
		shards: [i.contentRef],
		children: /* @__PURE__ */ (0, z.jsx)(gn.div, {
			"data-state": La(i.open),
			...r,
			ref: a,
			style: {
				pointerEvents: "auto",
				...r.style
			}
		})
	});
}, "DialogOverlayImpl")), Ea = "DialogContent", Da = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ba(Ea, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = ga(Ea, e.__scopeDialog);
	return /* @__PURE__ */ (0, z.jsx)(Jn, {
		present: r || a.open,
		children: a.modal ? /* @__PURE__ */ (0, z.jsx)(Oa, {
			...i,
			ref: t
		}) : /* @__PURE__ */ (0, z.jsx)(ka, {
			...i,
			ref: t
		})
	});
}, "DialogContent")), Oa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ga(Ea, e.__scopeDialog), r = _.useRef(null), i = Yt(t, n.contentRef, r);
	return _.useEffect(() => {
		let e = r.current;
		if (e) return la(e);
	}, []), /* @__PURE__ */ (0, z.jsx)(Aa, {
		...e,
		ref: i,
		trapFocus: n.open,
		disableOutsidePointerEvents: n.open,
		onCloseAutoFocus: En(e.onCloseAutoFocus, (e) => {
			e.preventDefault(), n.triggerRef.current?.focus();
		}),
		onPointerDownOutside: En(e.onPointerDownOutside, (e) => {
			let t = e.detail.originalEvent, n = t.button === 0 && t.ctrlKey === !0;
			(t.button === 2 || n) && e.preventDefault();
		}),
		onFocusOutside: En(e.onFocusOutside, (e) => e.preventDefault())
	});
}, "DialogContentModal")), ka = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ga(Ea, e.__scopeDialog), r = _.useRef(!1), i = _.useRef(!1);
	return /* @__PURE__ */ (0, z.jsx)(Aa, {
		...e,
		ref: t,
		trapFocus: !1,
		disableOutsidePointerEvents: !1,
		onCloseAutoFocus: (t) => {
			e.onCloseAutoFocus?.(t), t.defaultPrevented || (r.current || n.triggerRef.current?.focus(), t.preventDefault()), r.current = !1, i.current = !1;
		},
		onInteractOutside: (t) => {
			e.onInteractOutside?.(t), t.defaultPrevented || (r.current = !0, t.detail.originalEvent.type === "pointerdown" && (i.current = !0));
			let a = t.target;
			n.triggerRef.current?.contains(a) && t.preventDefault(), t.detail.originalEvent.type === "focusin" && i.current && t.preventDefault();
		}
	});
}, "DialogContentNonModal")), Aa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: i, onCloseAutoFocus: a, ...o } = e, s = ga(Ea, n);
	return Kr(), /* @__PURE__ */ (0, z.jsx)(z.Fragment, { children: /* @__PURE__ */ (0, z.jsx)(Dr, {
		asChild: !0,
		loop: !0,
		trapped: r,
		onMountAutoFocus: i,
		onUnmountAutoFocus: a,
		children: /* @__PURE__ */ (0, z.jsx)(hr, {
			role: "dialog",
			id: s.contentId,
			"aria-describedby": s.descriptionPresent ? s.descriptionId : void 0,
			"aria-labelledby": s.titlePresent ? s.titleId : void 0,
			"data-state": La(s.open),
			...o,
			ref: t,
			deferPointerDownOutside: !0,
			onDismiss: () => s.onOpenChange(!1)
		})
	}) });
}, "DialogContentImpl")), ja = "DialogTitle", Ma = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(ja, n), { setTitleCount: a } = i;
	return jn(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, z.jsx)(gn.h2, {
		id: i.titleId,
		...r,
		ref: t
	});
}, "DialogTitle")), Na = "DialogDescription", Pa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(Na, n), { setDescriptionCount: a } = i;
	return jn(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, z.jsx)(gn.p, {
		id: i.descriptionId,
		...r,
		ref: t
	});
}, "DialogDescription")), Fa = "DialogClose", Ia = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(Fa, n);
	return /* @__PURE__ */ (0, z.jsx)(gn.button, {
		type: "button",
		...r,
		ref: t,
		onClick: En(e.onClick, () => i.onOpenChange(!1))
	});
}, "DialogClose"));
function La(e) {
	return e ? "open" : "closed";
}
da(La, "getState");
//#endregion
//#region node_modules/@radix-ui/react-label/dist/index.mjs
var Ra = Object.defineProperty, za = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ((e, t) => Ra(e, "name", {
	value: t,
	configurable: !0
}))(function(e, t) {
	return /* @__PURE__ */ (0, z.jsx)(gn.label, {
		...e,
		ref: t,
		onMouseDown: (t) => {
			t.target.closest("button, input, select, textarea") || (e.onMouseDown?.(t), !t.defaultPrevented && t.detail > 1 && t.preventDefault());
		}
	});
}, "Label")), Ba = Object.defineProperty, Va = (e, t) => Ba(e, "name", {
	value: t,
	configurable: !0
}), Ha = "Progress", Ua = 100, [Wa, Ga] = /* @__PURE__ */ xn(Ha), [Ka, qa] = Wa(Ha), Ja = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Va(function(e, t) {
	let { __scopeProgress: n, value: r = null, max: i, getValueLabel: a = Za, ...o } = e;
	(i || i === 0) && !eo(i) && console.error(no(`${i}`, "Progress"));
	let s = eo(i) ? i : Ua;
	r !== null && !to(r, s) && console.error(ro(`${r}`, "Progress"));
	let c = to(r, s) ? r : null, l = $a(c) ? a(c, s) : void 0;
	return /* @__PURE__ */ (0, z.jsx)(Ka, {
		scope: n,
		value: c,
		max: s,
		children: /* @__PURE__ */ (0, z.jsx)(gn.div, {
			"aria-valuemax": s,
			"aria-valuemin": 0,
			"aria-valuenow": $a(c) ? c : void 0,
			"aria-valuetext": l,
			role: "progressbar",
			"data-state": Qa(c, s),
			"data-value": c ?? void 0,
			"data-max": s,
			...o,
			ref: t
		})
	});
}, "Progress")), Ya = "ProgressIndicator", Xa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Va(function(e, t) {
	let { __scopeProgress: n, ...r } = e, i = qa(Ya, n);
	return /* @__PURE__ */ (0, z.jsx)(gn.div, {
		"data-state": Qa(i.value, i.max),
		"data-value": i.value ?? void 0,
		"data-max": i.max,
		...r,
		ref: t
	});
}, "ProgressIndicator"));
function Za(e, t) {
	return `${Math.round(e / t * 100)}%`;
}
Va(Za, "defaultGetValueLabel");
function Qa(e, t) {
	return e == null ? "indeterminate" : e === t ? "complete" : "loading";
}
Va(Qa, "getProgressState");
function $a(e) {
	return typeof e == "number";
}
Va($a, "isNumber");
function eo(e) {
	return $a(e) && !isNaN(e) && e > 0;
}
Va(eo, "isValidMaxNumber");
function to(e, t) {
	return $a(e) && !isNaN(e) && e <= t && e >= 0;
}
Va(to, "isValidValueNumber");
function no(e, t) {
	return `Invalid prop \`max\` of value \`${e}\` supplied to \`${t}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${Ua}\`.`;
}
Va(no, "getInvalidMaxError");
function ro(e, t) {
	return `Invalid prop \`value\` of value \`${e}\` supplied to \`${t}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${Ua} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
Va(ro, "getInvalidValueError");
var io = Ja, ao = Xa, oo = he("group/button inline-flex shrink-0 translate-x-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/80",
			outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
			destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			icon: "size-8",
			"icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function so({ className: e, variant: t = "default", size: n = "default", asChild: r = !1, ...i }) {
	let a = r ? en : "button";
	return /* @__PURE__ */ (0, z.jsx)(a, {
		"data-slot": "button",
		"data-variant": t,
		"data-size": n,
		className: R(oo({
			variant: t,
			size: n,
			className: e
		})),
		...i
	});
}
//#endregion
//#region node_modules/cmdk/dist/chunk-NZJY6EH4.mjs
var co = 1, lo = .9, uo = .8, H = .17, U = .1, fo = .999, po = .9999, mo = .99, ho = /[\\\/_+.#"@\[\(\{&]/, go = /[\\\/_+.#"@\[\(\{&]/g, _o = /[\s-]/, vo = /[\s-]/g;
function yo(e, t, n, r, i, a, o) {
	if (a === t.length) return i === e.length ? co : mo;
	var s = `${i},${a}`;
	if (o[s] !== void 0) return o[s];
	for (var c = r.charAt(a), l = n.indexOf(c, i), u = 0, d, f, p, m; l >= 0;) d = yo(e, t, n, r, l + 1, a + 1, o), d > u && (l === i ? d *= co : ho.test(e.charAt(l - 1)) ? (d *= uo, p = e.slice(i, l - 1).match(go), p && i > 0 && (d *= fo ** +p.length)) : _o.test(e.charAt(l - 1)) ? (d *= lo, m = e.slice(i, l - 1).match(vo), m && i > 0 && (d *= fo ** +m.length)) : (d *= H, i > 0 && (d *= fo ** +(l - i))), e.charAt(l) !== t.charAt(a) && (d *= po)), (d < U && n.charAt(l - 1) === r.charAt(a + 1) || r.charAt(a + 1) === r.charAt(a) && n.charAt(l - 1) !== r.charAt(a)) && (f = yo(e, t, n, r, l + 1, a + 2, o), f * U > d && (d = f * U)), d > u && (u = d), l = n.indexOf(c, l + 1);
	return o[s] = u, u;
}
function bo(e) {
	return e.toLowerCase().replace(vo, " ");
}
function xo(e, t, n) {
	return e = n && n.length > 0 ? `${e + " " + n.join(" ")}` : e, yo(e, t, bo(e), bo(t), 0, 0, {});
}
//#endregion
//#region node_modules/cmdk/dist/index.mjs
var So = "[cmdk-group=\"\"]", Co = "[cmdk-group-items=\"\"]", wo = "[cmdk-group-heading=\"\"]", To = "[cmdk-item=\"\"]", Eo = `${To}:not([aria-disabled="true"])`, Do = "cmdk-item-select", Oo = "data-value", ko = (e, t, n) => xo(e, t, n), Ao = _.createContext(void 0), jo = () => _.useContext(Ao), Mo = _.createContext(void 0), No = () => _.useContext(Mo), Po = _.createContext(void 0), Fo = _.forwardRef((e, t) => {
	let n = Yo(() => ({
		search: "",
		value: e.value ?? e.defaultValue ?? "",
		selectedItemId: void 0,
		filtered: {
			count: 0,
			items: /* @__PURE__ */ new Map(),
			groups: /* @__PURE__ */ new Set()
		}
	})), r = Yo(() => /* @__PURE__ */ new Set()), i = Yo(() => /* @__PURE__ */ new Map()), a = Yo(() => /* @__PURE__ */ new Map()), o = Yo(() => /* @__PURE__ */ new Set()), s = qo(e), { label: c, children: l, value: u, onValueChange: d, filter: f, shouldFilter: p, loop: m, disablePointerSelection: h = !1, vimBindings: g = !0, ...v } = e, y = ir(), b = ir(), x = ir(), S = _.useRef(null), C = Qo();
	Jo(() => {
		if (u !== void 0) {
			let e = u.trim();
			n.current.value = e, w.emit();
		}
	}, [u]), Jo(() => {
		C(6, ne);
	}, []);
	let w = _.useMemo(() => ({
		subscribe: (e) => (o.current.add(e), () => o.current.delete(e)),
		snapshot: () => n.current,
		setState: (e, t, r) => {
			var i, a, o;
			if (!Object.is(n.current[e], t)) {
				if (n.current[e] = t, e === "search") D(), te(), C(1, E);
				else if (e === "value") {
					if (document.activeElement.hasAttribute("cmdk-input") || document.activeElement.hasAttribute("cmdk-root")) {
						let e = document.getElementById(x);
						e ? e.focus() : (i = document.getElementById(y)) == null || i.focus();
					}
					if (C(7, () => {
						n.current.selectedItemId = re()?.id, w.emit();
					}), r || C(5, ne), s.current?.value !== void 0) {
						let e = t ?? "";
						(o = (a = s.current).onValueChange) == null || o.call(a, e);
						return;
					}
				}
				w.emit();
			}
		},
		emit: () => {
			o.current.forEach((e) => e());
		}
	}), []), T = _.useMemo(() => ({
		value: (e, t, r) => {
			t !== a.current.get(e)?.value && (a.current.set(e, {
				value: t,
				keywords: r
			}), n.current.filtered.items.set(e, ee(t, r)), C(2, () => {
				te(), w.emit();
			}));
		},
		item: (e, t) => (r.current.add(e), t && (i.current.has(t) ? i.current.get(t).add(e) : i.current.set(t, /* @__PURE__ */ new Set([e]))), C(3, () => {
			D(), te(), n.current.value || E(), w.emit();
		}), () => {
			a.current.delete(e), r.current.delete(e), n.current.filtered.items.delete(e);
			let t = re();
			C(4, () => {
				D(), t?.getAttribute("id") === e && E(), w.emit();
			});
		}),
		group: (e) => (i.current.has(e) || i.current.set(e, /* @__PURE__ */ new Set()), () => {
			a.current.delete(e), i.current.delete(e);
		}),
		filter: () => s.current.shouldFilter,
		label: c || e["aria-label"],
		getDisablePointerSelection: () => s.current.disablePointerSelection,
		listId: y,
		inputId: x,
		labelId: b,
		listInnerRef: S
	}), []);
	function ee(e, t) {
		let r = s.current?.filter ?? ko;
		return e ? r(e, n.current.search, t) : 0;
	}
	function te() {
		if (!n.current.search || s.current.shouldFilter === !1) return;
		let e = n.current.filtered.items, t = [];
		n.current.filtered.groups.forEach((n) => {
			let r = i.current.get(n), a = 0;
			r.forEach((t) => {
				let n = e.get(t);
				a = Math.max(n, a);
			}), t.push([n, a]);
		});
		let r = S.current;
		ie().sort((t, n) => {
			let r = t.getAttribute("id"), i = n.getAttribute("id");
			return (e.get(i) ?? 0) - (e.get(r) ?? 0);
		}).forEach((e) => {
			let t = e.closest(Co);
			t ? t.appendChild(e.parentElement === t ? e : e.closest(`${Co} > *`)) : r.appendChild(e.parentElement === r ? e : e.closest(`${Co} > *`));
		}), t.sort((e, t) => t[1] - e[1]).forEach((e) => {
			let t = S.current?.querySelector(`${So}[${Oo}="${encodeURIComponent(e[0])}"]`);
			t?.parentElement.appendChild(t);
		});
	}
	function E() {
		let e = ie().find((e) => e.getAttribute("aria-disabled") !== "true")?.getAttribute(Oo);
		w.setState("value", e || void 0);
	}
	function D() {
		if (!n.current.search || s.current.shouldFilter === !1) {
			n.current.filtered.count = r.current.size;
			return;
		}
		n.current.filtered.groups = /* @__PURE__ */ new Set();
		let e = 0;
		for (let t of r.current) {
			let r = ee(a.current.get(t)?.value ?? "", a.current.get(t)?.keywords ?? []);
			n.current.filtered.items.set(t, r), r > 0 && e++;
		}
		for (let [e, t] of i.current) for (let r of t) if (n.current.filtered.items.get(r) > 0) {
			n.current.filtered.groups.add(e);
			break;
		}
		n.current.filtered.count = e;
	}
	function ne() {
		var e;
		let t = re();
		t && (t.parentElement?.firstChild === t && ((e = t.closest(So)?.querySelector(wo)) == null || e.scrollIntoView({ block: "nearest" })), t.scrollIntoView({ block: "nearest" }));
	}
	function re() {
		return S.current?.querySelector(`${To}[aria-selected="true"]`);
	}
	function ie() {
		return Array.from(S.current?.querySelectorAll(Eo) || []);
	}
	function ae(e) {
		let t = ie()[e];
		t && w.setState("value", t.getAttribute(Oo));
	}
	function oe(e) {
		var t;
		let n = re(), r = ie(), i = r.findIndex((e) => e === n), a = r[i + e];
		(t = s.current) != null && t.loop && (a = i + e < 0 ? r[r.length - 1] : i + e === r.length ? r[0] : r[i + e]), a && w.setState("value", a.getAttribute(Oo));
	}
	function se(e) {
		let t = re()?.closest(So), n;
		for (; t && !n;) t = e > 0 ? Go(t, So) : Ko(t, So), n = t?.querySelector(Eo);
		n ? w.setState("value", n.getAttribute(Oo)) : oe(e);
	}
	let O = () => ae(ie().length - 1), k = (e) => {
		e.preventDefault(), e.metaKey ? O() : e.altKey ? se(1) : oe(1);
	}, A = (e) => {
		e.preventDefault(), e.metaKey ? ae(0) : e.altKey ? se(-1) : oe(-1);
	};
	return _.createElement(gn.div, {
		ref: t,
		tabIndex: -1,
		...v,
		"cmdk-root": "",
		onKeyDown: (e) => {
			var t;
			(t = v.onKeyDown) == null || t.call(v, e);
			let n = e.nativeEvent.isComposing || e.keyCode === 229;
			if (!(e.defaultPrevented || n)) switch (e.key) {
				case "n":
				case "j":
					g && e.ctrlKey && k(e);
					break;
				case "ArrowDown":
					k(e);
					break;
				case "p":
				case "k":
					g && e.ctrlKey && A(e);
					break;
				case "ArrowUp":
					A(e);
					break;
				case "Home":
					e.preventDefault(), ae(0);
					break;
				case "End":
					e.preventDefault(), O();
					break;
				case "Enter": {
					e.preventDefault();
					let t = re();
					if (t) {
						let e = new Event(Do);
						t.dispatchEvent(e);
					}
				}
			}
		}
	}, _.createElement("label", {
		"cmdk-label": "",
		htmlFor: T.inputId,
		id: T.labelId,
		style: ts
	}, c), es(e, (e) => _.createElement(Mo.Provider, { value: w }, _.createElement(Ao.Provider, { value: T }, e))));
}), Io = _.forwardRef((e, t) => {
	let n = ir(), r = _.useRef(null), i = _.useContext(Po), a = jo(), o = qo(e), s = o.current?.forceMount ?? i?.forceMount;
	Jo(() => {
		if (!s) return a.item(n, i?.id);
	}, [s]);
	let c = Zo(n, r, [
		e.value,
		e.children,
		r
	], e.keywords), l = No(), u = Xo((e) => e.value && e.value === c.current), d = Xo((e) => s || a.filter() === !1 ? !0 : !e.search || e.filtered.items.get(n) > 0);
	_.useEffect(() => {
		let t = r.current;
		if (!(!t || e.disabled)) return t.addEventListener(Do, f), () => t.removeEventListener(Do, f);
	}, [
		d,
		e.onSelect,
		e.disabled
	]);
	function f() {
		var e, t;
		p(), (t = (e = o.current).onSelect) == null || t.call(e, c.current);
	}
	function p() {
		l.setState("value", c.current, !0);
	}
	if (!d) return null;
	let { disabled: m, value: h, onSelect: g, forceMount: v, keywords: y, ...b } = e;
	return _.createElement(gn.div, {
		ref: Jt(r, t),
		...b,
		id: n,
		"cmdk-item": "",
		role: "option",
		"aria-disabled": !!m,
		"aria-selected": !!u,
		"data-disabled": !!m,
		"data-selected": !!u,
		onPointerMove: m || a.getDisablePointerSelection() ? void 0 : p,
		onClick: m ? void 0 : f
	}, e.children);
}), Lo = _.forwardRef((e, t) => {
	let { heading: n, children: r, forceMount: i, ...a } = e, o = ir(), s = _.useRef(null), c = _.useRef(null), l = ir(), u = jo(), d = Xo((e) => i || u.filter() === !1 ? !0 : !e.search || e.filtered.groups.has(o));
	Jo(() => u.group(o), []), Zo(o, s, [
		e.value,
		e.heading,
		c
	]);
	let f = _.useMemo(() => ({
		id: o,
		forceMount: i
	}), [i]);
	return _.createElement(gn.div, {
		ref: Jt(s, t),
		...a,
		"cmdk-group": "",
		role: "presentation",
		hidden: !d || void 0
	}, n && _.createElement("div", {
		ref: c,
		"cmdk-group-heading": "",
		"aria-hidden": !0,
		id: l
	}, n), es(e, (e) => _.createElement("div", {
		"cmdk-group-items": "",
		role: "group",
		"aria-labelledby": n ? l : void 0
	}, _.createElement(Po.Provider, { value: f }, e))));
}), Ro = _.forwardRef((e, t) => {
	let { alwaysRender: n, ...r } = e, i = _.useRef(null), a = Xo((e) => !e.search);
	return !n && !a ? null : _.createElement(gn.div, {
		ref: Jt(i, t),
		...r,
		"cmdk-separator": "",
		role: "separator"
	});
}), zo = _.forwardRef((e, t) => {
	let { onValueChange: n, ...r } = e, i = e.value != null, a = No(), o = Xo((e) => e.search), s = Xo((e) => e.selectedItemId), c = jo();
	return _.useEffect(() => {
		e.value != null && a.setState("search", e.value);
	}, [e.value]), _.createElement(gn.input, {
		ref: t,
		...r,
		"cmdk-input": "",
		autoComplete: "off",
		autoCorrect: "off",
		spellCheck: !1,
		"aria-autocomplete": "list",
		role: "combobox",
		"aria-expanded": !0,
		"aria-controls": c.listId,
		"aria-labelledby": c.labelId,
		"aria-activedescendant": s,
		id: c.inputId,
		type: "text",
		value: i ? e.value : o,
		onChange: (e) => {
			i || a.setState("search", e.target.value), n?.(e.target.value);
		}
	});
}), Bo = _.forwardRef((e, t) => {
	let { children: n, label: r = "Suggestions", ...i } = e, a = _.useRef(null), o = _.useRef(null), s = Xo((e) => e.selectedItemId), c = jo();
	return _.useEffect(() => {
		if (o.current && a.current) {
			let e = o.current, t = a.current, n, r = new ResizeObserver(() => {
				n = requestAnimationFrame(() => {
					let n = e.offsetHeight;
					t.style.setProperty("--cmdk-list-height", n.toFixed(1) + "px");
				});
			});
			return r.observe(e), () => {
				cancelAnimationFrame(n), r.unobserve(e);
			};
		}
	}, []), _.createElement(gn.div, {
		ref: Jt(a, t),
		...i,
		"cmdk-list": "",
		role: "listbox",
		tabIndex: -1,
		"aria-activedescendant": s,
		"aria-label": r,
		id: c.listId
	}, es(e, (e) => _.createElement("div", {
		ref: Jt(o, c.listInnerRef),
		"cmdk-list-sizer": ""
	}, e)));
}), Vo = _.forwardRef((e, t) => {
	let { open: n, onOpenChange: r, overlayClassName: i, contentClassName: a, container: o, ...s } = e;
	return _.createElement(_a, {
		open: n,
		onOpenChange: r
	}, _.createElement(xa, { container: o }, _.createElement(Ca, {
		"cmdk-overlay": "",
		className: i
	}), _.createElement(Da, {
		"aria-label": e.label,
		"cmdk-dialog": "",
		className: a
	}, _.createElement(Fo, {
		ref: t,
		...s
	}))));
}), Ho = _.forwardRef((e, t) => Xo((e) => e.filtered.count === 0) ? _.createElement(gn.div, {
	ref: t,
	...e,
	"cmdk-empty": "",
	role: "presentation"
}) : null), Uo = _.forwardRef((e, t) => {
	let { progress: n, children: r, label: i = "Loading...", ...a } = e;
	return _.createElement(gn.div, {
		ref: t,
		...a,
		"cmdk-loading": "",
		role: "progressbar",
		"aria-valuenow": n,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-label": i
	}, es(e, (e) => _.createElement("div", { "aria-hidden": !0 }, e)));
}), Wo = Object.assign(Fo, {
	List: Bo,
	Item: Io,
	Input: zo,
	Group: Lo,
	Separator: Ro,
	Dialog: Vo,
	Empty: Ho,
	Loading: Uo
});
function Go(e, t) {
	let n = e.nextElementSibling;
	for (; n;) {
		if (n.matches(t)) return n;
		n = n.nextElementSibling;
	}
}
function Ko(e, t) {
	let n = e.previousElementSibling;
	for (; n;) {
		if (n.matches(t)) return n;
		n = n.previousElementSibling;
	}
}
function qo(e) {
	let t = _.useRef(e);
	return Jo(() => {
		t.current = e;
	}), t;
}
var Jo = typeof window > "u" ? _.useEffect : _.useLayoutEffect;
function Yo(e) {
	let t = _.useRef();
	return t.current === void 0 && (t.current = e()), t;
}
function Xo(e) {
	let t = No(), n = () => e(t.snapshot());
	return _.useSyncExternalStore(t.subscribe, n, n);
}
function Zo(e, t, n, r = []) {
	let i = _.useRef(), a = jo();
	return Jo(() => {
		var o;
		let s = (() => {
			for (let e of n) {
				if (typeof e == "string") return e.trim();
				if (typeof e == "object" && "current" in e) return e.current ? e.current.textContent?.trim() : i.current;
			}
		})(), c = r.map((e) => e.trim());
		a.value(e, s, c), (o = t.current) == null || o.setAttribute(Oo, s), i.current = s;
	}), i;
}
var Qo = () => {
	let [e, t] = _.useState(), n = Yo(() => /* @__PURE__ */ new Map());
	return Jo(() => {
		n.current.forEach((e) => e()), n.current = /* @__PURE__ */ new Map();
	}, [e]), (e, r) => {
		n.current.set(e, r), t({});
	};
};
function $o(e) {
	let t = e.type;
	return typeof t == "function" ? t(e.props) : "render" in t ? t.render(e.props) : e;
}
function es({ asChild: e, children: t }, n) {
	return e && _.isValidElement(t) ? _.cloneElement($o(t), { ref: t.ref }, n(t.props.children)) : n(t);
}
var ts = {
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: "0",
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	borderWidth: "0"
};
//#endregion
//#region src/lib/fadeMask.ts
function ns(e) {
	let t = e.scrollHeight - e.clientHeight > 1, n = t && e.scrollTop > 1, r = t && e.scrollTop + e.clientHeight < e.scrollHeight - 1;
	return n && r ? "both" : n ? "top" : r ? "bottom" : "none";
}
//#endregion
//#region src/lib/searchScore.ts
var rs = 1, is = .85, as = .7, os = .55, ss = .45, cs = .2, ls = /[/\-_.]+/g;
function us(e) {
	return e.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function ds(e) {
	let t = us(e).replace(ls, " ").trim().split(/\s+/u);
	return t[0] ? t : [];
}
function fs(e) {
	return us(e).replace(ls, "").replace(/\s+/gu, "");
}
function ps(e, t) {
	let n = 0;
	for (let r of t) if (r === e[n] && (n += 1, n === e.length)) return !0;
	return !1;
}
function ms(e, t) {
	let n = e.length - t.length;
	if (Math.abs(n) > 1 || e === t) return n === 0 && e === t;
	let r = e, i = t;
	n > 0 && (r = t, i = e);
	let a = 0;
	for (; a < r.length && r[a] === i[a];) a += 1;
	return a === r.length ? i.length - r.length === 1 : r.length === i.length ? a + 1 < r.length && r[a] === i[a + 1] && r[a + 1] === i[a] && r.slice(a + 2) === i.slice(a + 2) || r.slice(a + 1) === i.slice(a + 1) : r.slice(a) === i.slice(a + 1);
}
function hs(e, t, n, r) {
	let i = 0;
	for (let n of t) {
		if (n === e) return rs;
		n.startsWith(e) && (i = Math.max(i, is)), n.includes(e) && (i = Math.max(i, os)), e.length >= 4 && ms(e, n) && (i = Math.max(i, ss)), e.length >= 3 && ps(e, n) && (i = Math.max(i, cs));
	}
	return (r === e || e.length >= 2 && r.startsWith(e)) && (i = Math.max(i, as)), n.includes(e) && (i = Math.max(i, os)), i;
}
function gs(e, t) {
	let n = ds(t);
	if (n.length === 0) return 1;
	let r = ds(e), i = fs(e), a = r.map((e) => e[0] ?? "").join(""), o = 0;
	for (let e of n) {
		let t = hs(e, r, i, a);
		if (t === 0) return 0;
		o += t;
	}
	return o;
}
function _s(e, t, n = []) {
	if (!t.trim()) return 1;
	let r = gs(e, t);
	for (let e of n) r = Math.max(r, gs(e, t));
	return n.length > 0 && (r = Math.max(r, gs(`${e} ${n.join(" ")}`, t))), r;
}
//#endregion
//#region src/components/ui/dialog.tsx
function vs({ ...e }) {
	return /* @__PURE__ */ (0, z.jsx)(_a, {
		"data-slot": "dialog",
		...e
	});
}
function ys({ ...e }) {
	return /* @__PURE__ */ (0, z.jsx)(xa, {
		"data-slot": "dialog-portal",
		...e
	});
}
function bs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Ca, {
		"data-slot": "dialog-overlay",
		className: R("fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-overlay-in data-closed:animate-overlay-out motion-reduce:animate-none!", e),
		...t
	});
}
function xs({ className: e, children: t, showCloseButton: n = !0, container: r, ...i }) {
	return /* @__PURE__ */ (0, z.jsxs)(ys, {
		container: r,
		children: [/* @__PURE__ */ (0, z.jsx)(bs, {}), /* @__PURE__ */ (0, z.jsxs)(Da, {
			"data-slot": "dialog-content",
			className: R("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm data-open:animate-dialog-in data-closed:animate-dialog-out motion-reduce:animate-none!", e),
			...i,
			children: [t, n && /* @__PURE__ */ (0, z.jsx)(Ia, {
				"data-slot": "dialog-close",
				asChild: !0,
				children: /* @__PURE__ */ (0, z.jsxs)(so, {
					variant: "ghost",
					className: "absolute top-2 right-2",
					size: "icon-sm",
					children: [/* @__PURE__ */ (0, z.jsx)(ue, {}), /* @__PURE__ */ (0, z.jsx)("span", {
						className: "sr-only",
						children: "Close"
					})]
				})
			})]
		})]
	});
}
function Ss({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		"data-slot": "dialog-header",
		className: R("flex flex-col gap-2", e),
		...t
	});
}
function Cs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Ma, {
		"data-slot": "dialog-title",
		className: R("font-heading text-base leading-none font-medium", e),
		...t
	});
}
function ws({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Pa, {
		"data-slot": "dialog-description",
		className: R("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", e),
		...t
	});
}
//#endregion
//#region src/components/ui/input.tsx
function Ts({ className: e, type: t, ...n }) {
	return /* @__PURE__ */ (0, z.jsx)("input", {
		type: t,
		"data-slot": "input",
		className: R("h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", e),
		...n
	});
}
//#endregion
//#region src/components/ui/textarea.tsx
function Es({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)("textarea", {
		"data-slot": "textarea",
		className: R("flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", e),
		...t
	});
}
//#endregion
//#region src/components/ui/input-group.tsx
function Ds({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		"data-slot": "input-group",
		role: "group",
		className: R("group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5", e),
		...t
	});
}
var Os = he("flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4", {
	variants: { align: {
		"inline-start": "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
		"inline-end": "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
		"block-start": "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
		"block-end": "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2"
	} },
	defaultVariants: { align: "inline-start" }
});
function ks({ className: e, align: t = "inline-start", ...n }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		role: "group",
		"data-slot": "input-group-addon",
		"data-align": t,
		className: R(Os({ align: t }), e),
		onClick: (e) => {
			e.target.closest("button") || e.currentTarget.parentElement?.querySelector("input")?.focus();
		},
		...n
	});
}
function As({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Es, {
		"data-slot": "input-group-control",
		className: R("flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent", e),
		...t
	});
}
//#endregion
//#region src/components/ui/command.tsx
var js = 280, Ms = "cubic-bezier(0.16, 1, 0.3, 1)";
function Ns(e) {
	return !!e?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function Ps(e) {
	if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
	let t = e.target;
	!(t instanceof HTMLButtonElement) || t.disabled || (e.preventDefault(), t.click());
}
function Fs({ className: e, filter: t = _s, loop: n = !0, ...r }) {
	return /* @__PURE__ */ (0, z.jsx)(Wo, {
		"data-slot": "command",
		className: R("flex size-full min-h-0 flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground", e),
		filter: t,
		loop: n,
		...r
	});
}
function Is({ children: e, commandRef: t, contentKey: n, contentRef: r, filter: i, title: a }) {
	let o = _.useRef(null), s = _.useRef(null), c = _.useRef(n), l = _.useRef(!1), u = l.current && c.current !== n;
	return c.current = n, l.current = !0, _.useLayoutEffect(() => {
		let e = r.current;
		if (!e) return;
		s.current?.cancel(), s.current = null;
		let t = e.offsetHeight, n = o.current;
		o.current = t;
		let i = e.ownerDocument.defaultView;
		if (n == null || n === t || Ns(i) || typeof e.animate != "function") return;
		let a = e.animate([{ height: `${n}px` }, { height: `${t}px` }], {
			duration: js,
			easing: Ms
		});
		return s.current = a, a.onfinish = () => {
			s.current === a && (s.current = null), o.current = e.offsetHeight;
		}, a.oncancel = () => {
			s.current === a && (s.current = null);
		}, () => {
			a.cancel();
		};
	}, [n, r]), _.useEffect(() => {
		let e = r.current;
		if (!e || typeof ResizeObserver > "u") return;
		let t = new ResizeObserver(() => {
			s.current || (o.current = e.offsetHeight);
		});
		return t.observe(e), () => t.disconnect();
	}, [r]), /* @__PURE__ */ (0, z.jsx)(Fs, {
		ref: t,
		className: u ? "animate-surface-in motion-reduce:animate-none!" : void 0,
		filter: i,
		label: a === "Accounts" ? "Search accounts" : "Search commands",
		onKeyDown: Ps,
		tabIndex: -1,
		children: e
	}, n);
}
function Ls({ title: e = "Command Palette", description: t = "Search for a command to run...", children: n, className: r, showCloseButton: i = !1, container: a, contentKey: o, filter: s, onEscapeKeyDown: c, ...l }) {
	let u = _.useRef(null), d = _.useRef(null);
	return _.useLayoutEffect(() => {
		let e = u.current;
		if (o === void 0 || !e || e.querySelector("input, textarea, [contenteditable=true]")) return;
		let t = e.getRootNode().activeElement;
		t && t !== e && e.contains(t) || e.focus();
	}, [o]), /* @__PURE__ */ (0, z.jsx)(vs, {
		...l,
		children: /* @__PURE__ */ (0, z.jsxs)(xs, {
			ref: d,
			className: R("top-1/3 left-1/2 -translate-x-1/2 translate-y-0 overflow-hidden rounded-xl! p-0", r),
			container: a,
			onEscapeKeyDown: c,
			onOpenAutoFocus: (e) => {
				e.preventDefault(), u.current?.querySelector("[data-slot=command-input], textarea, input")?.focus();
			},
			showCloseButton: i,
			children: [/* @__PURE__ */ (0, z.jsxs)(Ss, {
				className: "sr-only",
				children: [/* @__PURE__ */ (0, z.jsx)(Cs, { children: e }), /* @__PURE__ */ (0, z.jsx)(ws, { children: t })]
			}), /* @__PURE__ */ (0, z.jsx)(Is, {
				commandRef: u,
				contentKey: o,
				contentRef: d,
				filter: s,
				title: e,
				children: n
			})]
		})
	});
}
function Rs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)("div", {
		"data-slot": "command-input-wrapper",
		className: "p-1 pb-0",
		children: /* @__PURE__ */ (0, z.jsxs)(Ds, {
			className: "h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!",
			children: [/* @__PURE__ */ (0, z.jsx)(Wo.Input, {
				"data-slot": "command-input",
				className: R("w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50", e),
				...t
			}), /* @__PURE__ */ (0, z.jsx)(ks, { children: /* @__PURE__ */ (0, z.jsx)(j, { className: "size-4 shrink-0 opacity-50" }) })]
		})
	});
}
function zs({ className: e, onScroll: t, ...n }) {
	let r = _.useRef(null), [i, a] = _.useState("none"), o = _.useCallback(() => {
		let e = r.current;
		if (!e) return a("none");
		a(ns(e));
	}, []);
	return _.useLayoutEffect(() => {
		let e = r.current;
		if (!e || (o(), typeof ResizeObserver > "u")) return;
		let t = new ResizeObserver(o);
		t.observe(e);
		let n = e.querySelector("[cmdk-list-sizer]");
		return n && t.observe(n), () => t.disconnect();
	}, [o]), /* @__PURE__ */ (0, z.jsx)(Wo.List, {
		"data-slot": "command-list",
		"data-fade-mask": i,
		className: R("scroll-fade no-scrollbar max-h-80 min-h-0 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none", e),
		...n,
		ref: r,
		onScroll: (e) => {
			o(), t?.(e);
		}
	});
}
function Bs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Wo.Empty, {
		"data-slot": "command-empty",
		className: R("py-6 text-center text-sm text-muted-foreground", e),
		...t
	});
}
function Vs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Wo.Group, {
		"data-slot": "command-group",
		className: R("overflow-x-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground", e),
		...t
	});
}
function Hs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(Wo.Separator, {
		"data-slot": "command-separator",
		className: R("-mx-1 h-px bg-border", e),
		...t
	});
}
function Us({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ (0, z.jsxs)(Wo.Item, {
		"data-slot": "command-item",
		className: R("group/command-item relative flex scroll-my-1 cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors duration-150 select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground", e),
		...n,
		children: [t, /* @__PURE__ */ (0, z.jsx)(re, { className: "ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" })]
	});
}
//#endregion
//#region src/components/ui/label.tsx
function Ws({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(za, {
		"data-slot": "label",
		className: R("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", e),
		...t
	});
}
//#endregion
//#region src/lib/caseIds.ts
var Gs = /(?<!\d)\d{11}(?!\d)/g;
function Ks(e) {
	return [...new Set(e.match(Gs) ?? [])];
}
var qs = [
	"unfulfillable",
	"feedback",
	"stranded",
	"suppressed",
	"shippingQueue"
], Js = [
	{
		id: "unfulfillable",
		label: "Unfulfillable listings"
	},
	{
		id: "feedback",
		label: "Seller feedback"
	},
	{
		id: "stranded",
		label: "Stranded inventory"
	},
	{
		id: "suppressed",
		label: "Search suppressed listings"
	},
	{
		id: "shippingQueue",
		label: "Shipping queue"
	}
], Ys = {
	prepare: "active",
	sources: {
		unfulfillable: { status: "pending" },
		feedback: { status: "pending" },
		stranded: { status: "pending" },
		suppressed: { status: "pending" },
		shippingQueue: { status: "pending" }
	},
	workbook: "pending"
};
function Xs(e) {
	return qs.includes(e);
}
function Zs(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return Xs(t.source) ? t.status === "active" || t.status === "complete" || t.status === "error" : !1;
}
function Qs(e) {
	return !!(e && typeof e == "object" && e.type === "REPORTS_PROGRESS" && Zs(e));
}
function $s(e, t) {
	let n = t.status === "error" ? "error" : t.status === "complete" ? "complete" : "active";
	return {
		...e,
		sources: {
			...e.sources,
			[t.source]: {
				status: n,
				loaded: t.loaded,
				total: t.total,
				phase: t.phase,
				error: t.error
			}
		}
	};
}
function ec(e) {
	return qs.every((t) => {
		let n = e.sources[t].status;
		return n === "complete" || n === "error";
	});
}
function tc(e, t) {
	return e.workbook === "complete" ? "complete" : ec(e) && t ? "active" : e.workbook;
}
function nc(e) {
	return e.status === "complete" ? 100 : e.status === "error" ? null : e.source === "unfulfillable" ? oc(e) : e.source === "feedback" ? cc(e) : e.source === "suppressed" ? sc(e) : e.source === "shippingQueue" ? lc(e) : null;
}
function rc(e, t) {
	return Math.min(1, (e ?? 0) / t);
}
function ic(e, t) {
	if (e.status === "complete") return 100;
	let n = e.total ?? 0;
	return e.phase === t ? n <= 0 ? 100 : 80 + Math.round(20 * rc(e.loaded, n)) : n <= 0 ? e.loaded ? 80 : 0 : Math.round(80 * rc(e.loaded, n));
}
function ac(e) {
	if (e.status === "complete") return 100;
	let t = e.total;
	return t == null || t <= 0 ? null : Math.round(100 * rc(e.loaded, t));
}
function oc(e) {
	return ic(e, "removal");
}
function sc(e) {
	return ic(e, "issues");
}
function cc(e) {
	return ac(e);
}
function lc(e) {
	return ac(e);
}
function uc(e, t) {
	return t.status === "pending" ? "Waiting" : t.status === "complete" ? "Done" : t.status === "error" ? t.error ? `Failed: ${t.error}` : "Failed" : e === "unfulfillable" ? t.phase === "removal" ? t.total ? `Removal status ${t.loaded ?? 0} of ${t.total}` : "Checking removal status" : t.total ? `${t.loaded ?? 0} of ${t.total} listings` : t.loaded ? `${t.loaded} listings` : "Loading listings" : e === "feedback" ? t.loaded ? `${t.loaded.toLocaleString("en-US")} entries` : "Loading" : e === "suppressed" ? t.phase === "issues" ? t.total ? `Suppression reasons ${t.loaded ?? 0} of ${t.total}` : "Loading suppression reasons" : t.total == null ? t.loaded ? `${t.loaded} listings` : "Loading listings" : `${t.loaded ?? 0} of ${t.total} listings` : e === "shippingQueue" ? t.phase === "details" ? t.total ? `Shipment details ${t.loaded ?? 0} of ${t.total}` : "Loading shipment details" : t.total == null ? t.loaded ? `${t.loaded} shipments` : "Loading shipments" : `${t.loaded ?? 0} of ${t.total} shipments` : "Loading";
}
//#endregion
//#region src/lib/dates.ts
var dc = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
function fc(e) {
	return String(e).padStart(2, "0");
}
function pc(e) {
	return `${fc(e.getDate())}-${dc[e.getMonth()]}-${e.getFullYear()}`;
}
function mc(e) {
	return `${`${fc(e.getUTCDate())}-${dc[e.getUTCMonth()]}-${e.getUTCFullYear()}`} ${fc(e.getUTCHours())}:${fc(e.getUTCMinutes())}:${fc(e.getUTCSeconds())}`;
}
//#endregion
//#region src/lib/log.ts
var hc = "LOG_ENTRIES", gc = "[S4E]", _c = 300, vc = 600, yc = 400, bc = 25, xc = null, Sc = !(typeof process < "u" && process.env?.VITEST);
function Cc(e) {
	xc = e;
}
function wc() {
	return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
}
function Tc(e, t = _c) {
	return e.length > t ? `${e.slice(0, t - 1)}…` : e;
}
function Ec(e, t = "Unknown error.") {
	return e instanceof Error && e.message ? e.message : typeof e == "string" && e ? e : t;
}
function Dc(e) {
	if (!(e instanceof Error)) return { message: Tc(Ec(e)) };
	let t = {
		name: e.name,
		message: Tc(Ec(e))
	};
	return e.stack && (t.stack = Tc(e.stack, vc)), t;
}
function Oc(e) {
	if (Sc) {
		let t = e.level === "error" ? console.error : e.level === "warn" ? console.warn : console.info, n = e.ms === void 0 ? "" : ` ${e.ms}ms`, r = e.run ? ` [${e.run}]` : "";
		t(`${gc} ${e.ctx} · ${e.event}${n}${r}`, ...e.data ? [e.data] : []);
	}
	try {
		xc?.(e);
	} catch {}
}
function kc(e, t) {
	let n = (n, r, i, a) => {
		let o = {
			t: Date.now(),
			level: n,
			ctx: e,
			event: r
		};
		t && (o.run = t), a !== void 0 && (o.ms = a), i && Object.keys(i).length > 0 && (o.data = i), Oc(o);
	};
	return {
		info: (e, t) => n("info", e, t),
		warn: (e, t) => n("warn", e, t),
		error: (e, t) => n("error", e, t),
		time: (e, t) => {
			let r = wc();
			return (i, a = "info") => {
				let o = Math.round(wc() - r);
				return n(a, e, t || i ? {
					...t,
					...i
				} : void 0, o), o;
			};
		},
		withRun: (t) => kc(e, t)
	};
}
function Ac() {
	let e = [], t, n = () => {
		t !== void 0 && clearTimeout(t), t = void 0;
		let n = e;
		if (e = [], !(n.length === 0 || typeof chrome > "u" || !chrome.runtime?.id)) try {
			chrome.runtime.sendMessage({
				type: hc,
				entries: n
			}).catch(() => void 0);
		} catch {}
	};
	return (r) => {
		e.push(r), e.length >= bc ? n() : t ??= setTimeout(n, yc);
	};
}
var jc = `Only ${2e4.toLocaleString("en-US")} feedback entries were loaded. Seller Central has more.`, Mc = [
	"Date",
	"Rating",
	"Sentiment",
	"Order ID",
	"Feedback",
	"Item as described",
	"Seller response",
	"Response date",
	"Suppressed",
	"Partially suppressed",
	"Suppress reason",
	"Feedback ID"
], Nc = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: " "
};
function Pc(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 1 && e <= 3;
}
function Fc(e) {
	return Pc(e) ? e <= 2 ? "Negative" : "Neutral" : "";
}
function Ic(e) {
	return e.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (e, t) => {
		if (t.startsWith("#x") || t.startsWith("#X")) {
			let n = Number.parseInt(t.slice(2), 16);
			return Number.isFinite(n) ? String.fromCodePoint(n) : e;
		}
		if (t.startsWith("#")) {
			let n = Number.parseInt(t.slice(1), 10);
			return Number.isFinite(n) ? String.fromCodePoint(n) : e;
		}
		return Nc[t] ?? e;
	});
}
function Lc(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : mc(t);
}
function Rc(e) {
	return e == null ? "" : String(e);
}
function zc(e) {
	return e === !0 ? "Yes" : e === !1 ? "No" : "";
}
function Bc(e) {
	return zc(e.answerMap?.ItemAsDescribed?.booleanRating);
}
function Vc(e) {
	let t = typeof e.numericRating == "number" && Number.isFinite(e.numericRating) ? e.numericRating : "";
	return [
		Lc(e.feedbackDate),
		t,
		Fc(typeof t == "number" ? t : void 0),
		Rc(e.orderId),
		Ic(e.feedbackText ?? ""),
		Bc(e),
		Ic(e.responseText ?? ""),
		Lc(e.responseDate),
		zc(e.suppressed),
		zc(e.partiallySuppressed),
		Rc(e.suppressReasonId),
		Rc(e.feedbackId)
	];
}
function Hc(e) {
	return [[...Mc], ...e.map(Vc)];
}
//#endregion
//#region src/lib/dailyTasks.ts
var Uc = [
	"Feedback Manager",
	"Disposal Orders",
	"Open Cases"
];
function Wc(e = []) {
	let t = e.some((e) => e.feedbackIncomplete);
	return [
		[Uc[0]],
		...t ? [[jc]] : [],
		...Hc(e),
		[],
		[Uc[1]],
		[],
		[Uc[2]]
	];
}
//#endregion
//#region src/lib/shippingQueue.ts
var Gc = "https://sellercentral.amazon.com/fba/wmsr", Kc = "Shipment ID - Outside Reconciliation Window", qc = "Shipment ID - For Monitoring (Automatically Closed After 90 Days)", Jc = "Shipment ID - Investigation Completed - Contents Counted and Confirmed", Yc = "Shipment ID - Units Located - No Further Action Required", Xc = "Received in Full - No Discrepancies Found", Zc = "Shipment ID - New (Send List)", Qc = "Shipment ID - Overaged", $c = "Review Needed", el = "Proof of Inventory Ownership", tl = "Delivery", nl = "Loaded", rl = "Couldn’t load shipment details", il = "Some shipments could not be loaded. This sheet includes only the shipments that were obtainable.", al = "Shipment details could not be loaded for some shipments. Those rows are marked “Couldn’t load shipment details”.", ol = "Some shipments’ SKU lines couldn’t all be loaded. Those shipments list only the SKU lines that were obtainable.", sl = /* @__PURE__ */ "Shipment Name.Shipment ID.Shipment URL.Status.Destination FC.FC Country.Ship From Address ID.Created Date.Last Updated Date.MSKUs.Shipped Quantity.Received Quantity.Expected Quantity.Located Quantity.Stowed Quantity.Quantity Discrepancy.Workflow ID.Workflow Type.PO ID.Placement Status.Window Type.Window Start Date.Window End Date.Grace Period End Date.Window Compliance Status.Need By Date.Reason Code.Finalized.Finalized Date.Estimated Finalized Date UTC.Former Estimated Finalized Date UTC.Blocked.Partnered Import.Merchant Launched.ISMS Details.T2P Accelerate".split("."), cl = [
	"Details Status",
	"Claim Page URL",
	"Reimbursement Eligible",
	"Ineligibility Reason",
	"Estimated Eligibility Date",
	"Former Estimated Eligibility Date",
	"Days To Wait",
	"Eligibility Details",
	"Inquiry Status",
	"Inquiry Text",
	"Inquiry Case ID",
	"Inquiry Case Created Date",
	"Inquiry Case Created By",
	"Has Discrepancy",
	"Retail Domain",
	"Claims Allowed",
	"SKU Lines",
	"Total Discrepancy Quantity"
], ll = /* @__PURE__ */ "SKU.Title.FNSKU.ASIN.ASIN URL.UPC.Barcode Type.Barcode Value.Condition.Sortable.Eligible For Research.Item Expected Quantity.Item Located Quantity.Item Received Quantity.Adjustment Quantity.Reimbursed Quantity.Clawback Quantity.Acknowledged Quantity.Denied Quantity.Virtually Adjusted Quantity.Other Received Quantity.Other Receive Start Date.Other Receive End Date.IAR Auto Reconciliations.Item Discrepancy Quantity.Item Ineligibility Reason.Item Case ID.Item Reason Code".split("."), ul = [
	...sl,
	...cl,
	...ll
];
function dl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e), n = Number.isFinite(t) ? new Date(t) : new Date(String(e));
	return Number.isNaN(n.getTime()) ? String(e) : mc(n);
}
function fl(e) {
	return e === 0 || e === "0" ? "" : dl(e);
}
function W(e) {
	return e == null ? "" : String(e);
}
function pl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : "";
}
function ml(e) {
	return e === !0 ? "Yes" : e === !1 ? "No" : "";
}
function hl(e, t) {
	let n = pl(e), r = pl(t);
	return n === "" || r === "" ? "" : n - r;
}
function gl(e) {
	let t = e?.trim();
	return t ? `https://sellercentral.amazon.com/fba/inbound-shipment/summary/${encodeURIComponent(t)}/contents` : "";
}
function _l(e) {
	let t = e?.trim();
	return t ? `${Gc}/${encodeURIComponent(t)}` : "";
}
function vl(e) {
	let t = e?.trim();
	return t ? `https://www.amazon.com/dp/${encodeURIComponent(t)}` : "";
}
function yl(e) {
	if (e == null) return "";
	if (typeof e == "boolean") return ml(e);
	if (typeof e == "object") try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
	return String(e);
}
function bl(e) {
	return e ? Object.entries(e).map(([e, t]) => `${e}: ${yl(t)}`).join("; ") : "";
}
function xl(e) {
	let t = e?.discrepancyTotalRecords;
	return typeof t == "number" && t > (e?.items.length ?? 0);
}
function Sl(e) {
	let t = 0, n = !1;
	for (let r of e.items) typeof r.totalDiscrepancyQuantity == "number" && (t += r.totalDiscrepancyQuantity, n = !0);
	return n ? t : "";
}
var Cl = cl.map(() => ""), wl = ll.map(() => "");
function Tl(e) {
	let t = e.shipOrDeliveryWindow;
	return [
		W(e.shipmentName),
		W(e.shipmentId),
		gl(e.shipmentId),
		W(e.shipmentStatus),
		W(e.destinationFC),
		W(e.fcAddress),
		W(e.shipFromAddressId),
		dl(e.createdDate),
		dl(e.lastUpdatedDate),
		pl(e.mskus),
		pl(e.shippedQuantity),
		pl(e.receivedQuantity),
		pl(e.expectedQuantity),
		pl(e.locatedQuantity),
		pl(e.stowedQuantity),
		hl(e.receivedQuantity, e.shippedQuantity),
		W(e.workflowId),
		W(e.workflowType),
		W(e.poId),
		W(e.placementStatus),
		W(t?.windowType),
		dl(t?.windowStartDate),
		dl(t?.windowEndDate),
		dl(t?.gracePeriodEndDate),
		W(e.shipOrDeliveryWindowComplianceStatus),
		dl(e.needByDate),
		W(e.reasonCode),
		ml(e.finalized),
		dl(e.finalizedDate),
		dl(e.estimatedFinalizedDateUTC),
		dl(e.formerEstimatedFinalizedDateUTC),
		ml(e.blocked),
		ml(e.partneredImport),
		ml(e.merchantLaunched),
		yl(e.ismsDetails),
		yl(e.t2pAccelerate)
	];
}
function El(e) {
	let t = e.details;
	if (!t) return [e.detailsFetchFailed ? rl : "", ...Cl.slice(1)];
	let n = t.inquiry;
	return [
		nl,
		_l(e.shipmentId),
		ml(t.eligible),
		W(t.ineligibilityReason),
		fl(t.estimatedTimestamp),
		fl(t.formerEstimatedTimestamp),
		pl(t.daysToWait),
		bl(t.details),
		W(n?.inquiryStatus),
		W(n?.inquiryText),
		W(n?.caseId),
		dl(n?.caseCreationDate),
		W(n?.caseCreatedBy),
		ml(t.hasDiscrepancy),
		W(t.retailDomainName),
		ml(t.wmsrAllowed),
		pl(t.discrepancyTotalRecords ?? t.items.length),
		Sl(t)
	];
}
function Dl(e) {
	return e ? [
		W(e.merchantSKU),
		W(e.title),
		W(e.fnsku),
		W(e.asin),
		vl(e.asin),
		W(e.upc),
		W(e.barcodeType),
		W(e.barcodeValue),
		W(e.itemCondition),
		ml(e.isSortable),
		ml(e.eligibleForResearch),
		pl(e.expectedQuantity),
		pl(e.totalLocatedQuantity),
		pl(e.totalReceivedQuantity),
		pl(e.totalAdjustmentQuantity),
		pl(e.totalReimbursedQuantity),
		pl(e.totalClawbackQuantity),
		pl(e.totalAcknowledgedQuantity),
		pl(e.totalDeniedQuantity),
		pl(e.totalVirtuallyAdjustedQuantity),
		pl(e.otherReceivedQuantity),
		dl(e.otherReceiveStartDate),
		dl(e.otherReceiveEndDate),
		yl(e.iarAutoReconciliations),
		pl(e.totalDiscrepancyQuantity),
		W(e.ineligibilityReason),
		W(e.caseId),
		W(e.reasonCode)
	] : [...wl];
}
function Ol(e, t) {
	return [
		...Tl(e),
		...El(e),
		...Dl(t)
	];
}
function kl(e) {
	let t = e.details?.items ?? [];
	return t.length === 0 ? [Ol(e)] : t.map((t) => Ol(e, t));
}
function Al(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([il]), e.some((e) => e.detailsFetchFailed) && t.push([al]), e.some((e) => xl(e.details)) && t.push([ol]), t.length && t.push([]), t;
}
function jl(e) {
	return [
		...Al(e),
		[...ul],
		...e.flatMap(kl)
	];
}
function Ml(e) {
	if (e.detailsFailed) return "N/A";
	let t = e.shipmentIneligibilityReason ?? "", n = e.itemIneligibilityReason ?? "", r = e.discrepancy;
	if (t === "NINE_MONTH_STATUTE_OF_LIMITATIONS") return Kc;
	if (t === "NOT_ALL_SHIPPED") return qc;
	if (n === "ITEM_LEVEL_AUTHORITATIVE_RECEIVE") return Jc;
	if (n === "RESEARCHED") return Yc;
	if (r === 0) return Xc;
	if (e.eligible === !0) {
		if (typeof r == "number" && r < 0) return Zc;
		if (typeof r == "number" && r > 0) return Qc;
	}
	return t && t !== "NONE" ? t : $c;
}
function Nl(e, t) {
	if (t !== "Shipment ID - New (Send List)") return "N/A";
	let n = [];
	return e?.includes("INVOICE") && n.push(el), e?.includes("POD") && n.push(tl), n.length > 0 ? n.join(" AND ") : "N/A";
}
//#endregion
//#region src/lib/stranded.ts
var Pl = "America/New_York", Fl = [
	"SKU",
	"Condition",
	"Product Name",
	"ASIN",
	"FNSKU",
	"Status",
	"Status secondary",
	"Price",
	"Currency",
	"Available",
	"Total",
	"Reserved",
	"Inbound",
	"Unfulfillable",
	"Auto removal date",
	"Auto removal type",
	"Date stranded",
	"Stranded reason",
	"Stranded reason code",
	"Error message",
	"Fulfilled by",
	"Program",
	"Actions"
], Il = { RETURN: "Return to seller" };
function Ll(e) {
	return e == null ? "" : String(e);
}
function Rl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : "";
}
function zl(e) {
	let t = Rl(e);
	return t === "" ? 0 : t;
}
function G(e) {
	if (!e) return "";
	let t = Number(e);
	if (!Number.isFinite(t)) return e;
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? e : new Intl.DateTimeFormat("en-US", {
		timeZone: Pl,
		month: "2-digit",
		day: "2-digit",
		year: "numeric"
	}).format(n);
}
function Bl(e) {
	return e ? Il[e] ?? e : "";
}
function K(e) {
	return e ? e.split("#").map((e) => e.trim()).filter(Boolean).join(", ") : "";
}
function q(e) {
	return [
		Ll(e.SKU),
		Ll(e.Condition),
		Ll(e.ProductName),
		Ll(e.ASIN),
		Ll(e.FNSKU),
		Ll(e.Status),
		Ll(e.StatusSecondary),
		Rl(e.Price),
		Ll(e.PriceUnit),
		zl(e.Available),
		zl(e.TotalQuantity),
		zl(e.Reserved),
		zl(e.Inbound),
		zl(e.Unfulfillable),
		G(e.DateAutoRemoval),
		Bl(e.AutoRemovalType),
		G(e.DateStranded),
		Ll(e.StrandedReasonLabel || e.ErrorMessage || e.StrandedReasonCode || e.StrandedReason),
		Ll(e.StrandedReasonCode || e.StrandedReason),
		Ll(e.ErrorMessage),
		Ll(e.FulfilledBy),
		Ll(e.Program),
		K(e.SupportedActions)
	];
}
function J(e) {
	return [[...Fl], ...e.map(q)];
}
`${new URLSearchParams([
	["type", "RemovalOrderDetail"],
	["size", "50"],
	["offset", "0"],
	["sDate", ""],
	["eDate", ""],
	["days", "30"],
	["sDateOff", "0"],
	["eDateOff", "0"],
	...[
		"completed_qty",
		"order_status",
		"msku",
		"fnsku",
		"in_process_qty",
		"cancelled_qty",
		"request_qty",
		"amazon_order_id",
		"order_source",
		"creation_date",
		"order_type",
		"removal_order_id"
	].map((e) => ["cols", e]),
	["sort", JSON.stringify({
		keyName: "creation_date",
		sortingOrder: "DESC"
	})]
])}`;
var Vl = [
	"SKU",
	"ASIN",
	"FNSKU",
	"Title",
	"Status",
	"Price",
	"Currency",
	"Unfulfillable",
	"Carrier Damaged",
	"Customer Damaged",
	"Defective",
	"Expired",
	"Warehouse Damaged",
	"Distributor Damaged",
	"Removal Status",
	"Last Updated",
	"Image URL"
], Hl = "Total available for removal", Ul = "unknown ineligible reason", Wl = "Couldn’t load removal status", Gl = "Some unfulfillable listings could not be loaded. This sheet includes only the listings that were obtainable.", Kl = `Removal status could not be loaded for some SKUs. Those rows are marked “${Wl}”.`, ql = {
	InventoryInPendingRequest: "Inventory already scheduled for removal - no further action required",
	InventoryIsBound: "Inventory temporarily unavailable for removal as a result of an in-progress transaction or other process – please check again in a few days.",
	InventoryIsWarehouseDamaged: "Inventory damaged in the fulfillment center - no action required",
	InventoryIsAllocated: "Inventory is being processed (for order, customer return, or recall) - please try again in a few days",
	InventoryUnavailable: "Inventory Unavailable",
	InventoryIsInBoundProcessing: "Inventory is not available for removal; please try again in two days or contact Seller Support.",
	InventoryIsDcTransfer: "Inventory is not available for removal; please try again in two days or contact Seller Support.",
	InventoryInUnsupportedFc: "Inventory in location that cannot process removals - please contact us",
	InventoryInUnsupportedBzFc: "Inventory in a Bonded Zone location that cannot process removals - please contact us",
	InventoryInPickupRemovalUnsupportedFc: "Inventory in location that cannot process pickup removals - please process these units through other available channels",
	InventoryIsHazmatItem: "Inventory is classified as Hazardous Material (Hazmat) - please contact us",
	InventorySubjectToLendingRestriction: "Inventory cannot be removed due to Lending restrictions - please contact Amazon Lending"
}, Jl = [
	Hl,
	ql.InventoryInPendingRequest,
	ql.InventoryIsBound,
	ql.InventoryIsWarehouseDamaged,
	ql.InventoryIsAllocated,
	ql.InventoryUnavailable,
	ql.InventoryIsInBoundProcessing,
	ql.InventoryInUnsupportedFc,
	ql.InventoryInUnsupportedBzFc,
	ql.InventoryInPickupRemovalUnsupportedFc,
	ql.InventoryIsHazmatItem,
	ql.InventorySubjectToLendingRestriction,
	Ul
];
function Yl(e) {
	return e ? e.split(/[_-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase()).join(" ") : "";
}
function Xl(e) {
	return e == null ? "" : String(e);
}
function Zl(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function Ql(e) {
	for (let t of e.offers ?? []) {
		let e = t?.price?.price;
		if (!e?.amount) continue;
		let n = Number(e.amount);
		if (Number.isFinite(n)) return {
			amount: n,
			currency: e.currencyUnit ?? ""
		};
	}
	return {
		amount: "",
		currency: ""
	};
}
function $l(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e ?? []) n.quantity <= 0 || t.set(n.label, (t.get(n.label) ?? 0) + n.quantity);
	let n = Jl.filter((e) => t.has(e)).map((e) => ({
		label: e,
		quantity: t.get(e) ?? 0
	})), r = new Set(Jl);
	for (let [e, i] of t) r.has(e) || n.push({
		label: e,
		quantity: i
	});
	return n.map(({ label: e, quantity: t }) => `${e} - ${t} ${t === 1 ? "unit" : "units"}`).join(" || ");
}
function eu(e) {
	let t = e.availability?.unfulfillableDetails, n = Ql(e);
	return [
		Xl(e.coreListingFields?.sku),
		Xl(e.coreListingFields?.asin),
		Xl(e.coreListingFields?.fnSku),
		Xl(e.listingData?.title),
		Yl(e.status?.status),
		n.amount,
		n.currency,
		Zl(e.availability?.unfulfillable),
		Zl(t?.damagedByCarrier),
		Zl(t?.damagedByCustomer),
		Zl(t?.defective),
		Zl(t?.expired),
		Zl(t?.damagedByWarehouse),
		Zl(t?.damagedByDistributor),
		e.removalFetchFailed ? Wl : $l(e.removal),
		Xl(e.listingData?.lastUpdated),
		Xl(e.imageUrl)
	];
}
function tu(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([Gl]), e.some((e) => e.removalFetchFailed) && t.push([Kl]), t.length && t.push([]), t;
}
function nu(e) {
	return [
		...tu(e),
		[...Vl],
		...e.map(eu)
	];
}
//#endregion
//#region src/lib/suppressed.ts
var ru = "Some search-suppressed listings could not be loaded. This sheet includes only the listings that were obtainable.", iu = "Suppression reasons could not be loaded for some SKUs. Those rows are marked “Couldn’t load suppression reason”.", au = "Couldn’t load suppression reason", ou = /* @__PURE__ */ "SKU.ASIN.FNSKU.Title.Title differentiation.Image URL.Detail page URL.SKU Central link.Status.Status text.Highlighted state.Inline action.Inline action text.Fix listing URL.Issue.Issue type.Issue attribute.Enforcement.Issue source.Issue tags.Product type.Listing type.Bundle status.Fulfillment channel.Condition.Sub-condition.Parent ASIN.Parent SKU.Children.Is parent.Is customizable.Marketplace count.External IDs.Favorite.Tags.Shipping template.Shipping template ID.Legacy template.Date created.Last updated.Last 30 day GMS.Last 30 day GV.Last 30 day units sold.Quality grade.Quality grade updated.Available.Infinite quantity.Inventory availability.On hand.Inbound.Reserved.Reserved FC transfer.Reserved customer order.Reserved FC processing.Buyable in transit.Pending customer orders in transit.Unfulfillable.Carrier damaged.Customer damaged.Defective.Expired.Warehouse damaged.Distributor damaged.Researching short term.Researching mid term.Researching long term.FBA recommendation.Fulfillment markets.AA availabilities.Inventory alert.Days of supply.Recommended inventory.Price.Currency.Sale price.Min allowed price.Max allowed price.Business price.Quantity discount.Max retail price.Estimated shipping.Points.Automated pricing.Tax rate.Tax exclusive price.Tax exclusive business price.Lowest price.Lowest shipping.Buy box price.Buy box shipping.Sales rank.Sales rank category.Competitive benchmark price.Competitive benchmark shipping.Business program.Haul offer.FFO offer.Non-ALL offer.Actions.Points Central link".split(".");
function Y(e) {
	return e == null ? "" : String(e);
}
function X(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function su(e) {
	if (typeof e == "number" && Number.isFinite(e)) return e;
	if (typeof e == "string" && e.trim()) {
		let t = Number(e);
		if (Number.isFinite(t)) return t;
	}
	return "";
}
function cu(e) {
	return e == null ? "" : e ? "Yes" : "No";
}
function lu(e) {
	return su(e?.amount);
}
function uu(e) {
	return e.map((e) => e == null ? "" : String(e).trim()).filter(Boolean).join(" | ");
}
function du(e) {
	return (e ?? []).filter((e) => !!e).map((e) => `${e.key ?? ""}=${e.value ?? ""}`).filter((e) => e !== "=").join(", ");
}
function fu(e, t = "") {
	return (e ?? []).filter((e) => !!e).map((e) => `${Y(e.quantity)}${t}:${Y(e.amount)}`).filter((e) => e !== `${t}:` && e !== ":");
}
function pu(e) {
	return e ? [...fu(e.percentQuantityPrice, "%"), ...fu(e.fixedQuantityPrice)].join(", ") : "";
}
function mu(e) {
	return e ? uu([
		e.type,
		(e.tags ?? []).filter(Boolean).join(", "),
		(e.attributes ?? []).filter(Boolean).join(", "),
		du(e.parameters),
		(e.enforcementActions ?? []).filter(Boolean).join(", ")
	]) : "";
}
function hu(e) {
	return (e.availability?.availabilities ?? []).filter((e) => !!e).map((e) => `${Y(e.fmid)}:${X(e.quantity)}:${Y(e.fulfillmentChannelName)}`).filter(Boolean).join(" | ");
}
function gu(e) {
	return (e.availability?.aaAvailabilities ?? []).filter((e) => !!e).map((e) => uu([
		e.fulfillmentChannelName,
		X(e.quantity),
		e.isAggregatedAvailability ? "aggregated" : ""
	])).filter(Boolean).join(" | ");
}
function _u(e) {
	let t = e.availability?.inventoryAlert;
	return t ? uu([
		t.alertType,
		t.threshold == null ? "" : `threshold=${t.threshold}`,
		t.isThresholdReached == null ? "" : `reached=${cu(t.isThresholdReached)}`
	]) : "";
}
function vu(e, t) {
	if (!e) return "";
	let n = lu(t);
	return uu([
		e.label,
		e.state,
		n === "" ? "" : n
	]);
}
function yu(e) {
	let t = 0, n = (e) => {
		e != null && e !== "" && (t += 1);
	};
	return n(e.price?.price?.amount), n(e.businessPrice), n(e.quantityDiscount), n(e.salePrice?.price?.amount), n(e.minAllowedPrice?.price?.amount), n(e.maxAllowedPrice?.price?.amount), n(e.automatedPricing), n(e.maxRetailPrice?.price?.amount), n(e.haulOffer), n(e.ffoOffer), n(e.nonAllOffer), n(e.points), n(e.condition?.condition), t;
}
function bu(e) {
	let t = (e.offers ?? []).filter((e) => !!e);
	if (t.length !== 0) return t.reduce((e, t) => yu(t) > yu(e) ? t : e);
}
function xu(e) {
	let t = bu(e), n = e.availability?.unfulfillableDetails, r = e.pricing?.competitionState, i = e.pricing?.competitivePricingSummary?.competitiveBenchmarkPrice, a = lu(t?.price?.price);
	return [
		Y(e.coreListingFields?.sku ?? e.listingData?.sku),
		Y(e.coreListingFields?.asin ?? e.listingData?.asin),
		Y(e.coreListingFields?.fnSku ?? e.listingData?.fnSku),
		Y(e.listingData?.title),
		Y(e.listingData?.titleDifferentiation),
		Y(e.imageUrl),
		Y(e.detailPageUrl),
		Y(e.skuCentralLink),
		Yl(e.status?.status),
		Y(e.status?.statusText),
		Y(e.status?.highlightedState),
		Y(e.status?.inlineAction),
		Y(e.status?.inlineActionText),
		Y(e.status?.redirectionLink),
		...Tu(e),
		Y(e.listingData?.productType),
		Y(e.listingData?.listingType),
		Y(e.listingData?.bundleStatus),
		Y(e.coreListingFields?.fulfillmentChannel ?? t?.fulfillmentChannel),
		Y(t?.condition?.condition),
		Y(t?.condition?.subCondition),
		Y(e.listingData?.parentAsin),
		Y(e.listingData?.parentSku),
		X(e.listingData?.numberOfChildren),
		cu(e.isParentListing),
		cu(e.isCustomizable),
		X(e.marketplaceCount),
		(e.listingData?.externalIds ?? []).filter((e) => !!e).map((e) => `${Y(e.type)}:${Y(e.value)}`).filter((e) => e !== ":").join(", "),
		cu(e.annotations?.favorite),
		(e.annotations?.tagsAnnotation ?? []).map((e) => e?.value).filter((e) => !!e).join(", "),
		Y(e.shippingTemplate?.TemplateName),
		Y(e.shippingTemplate?.TemplateId),
		cu(e.shippingTemplate?.Legacy),
		Y(e.listingData?.dateCreated),
		Y(e.listingData?.lastUpdated),
		su(e.listingData?.last30DayGms),
		su(e.listingData?.last30DayGv),
		su(e.listingData?.last30DayUnitsSold),
		Y(e.listingData?.qualityRecommendationScore?.grade),
		Y(e.listingData?.qualityRecommendationScore?.lastUpdatedDate),
		X(e.availability?.quantity),
		cu(e.availability?.isQuantityInfinite),
		Y(e.availability?.inventoryAvailability),
		X(e.availability?.onHandQuantity),
		X(e.availability?.inbound),
		X(e.availability?.reservedQuantity),
		X(e.availability?.reserved?.fcTransfer),
		X(e.availability?.reserved?.customerOrder),
		X(e.availability?.reserved?.fcProcessing),
		X(e.availability?.buyableInTransit),
		X(e.availability?.pendingCustomerOrdersInTransit),
		X(e.availability?.unfulfillable),
		X(n?.damagedByCarrier),
		X(n?.damagedByCustomer),
		X(n?.defective),
		X(n?.expired),
		X(n?.damagedByWarehouse),
		X(n?.damagedByDistributor),
		X(e.availability?.researching?.shortTerm),
		X(e.availability?.researching?.midTerm),
		X(e.availability?.researching?.longTerm),
		mu(e.availability?.fbaRecommendation),
		hu(e),
		gu(e),
		_u(e),
		su(e.availability?.recommendation?.daysOfSupply),
		su(e.availability?.recommendation?.recommendedInventory),
		a,
		Y(t?.price?.price?.currencyUnit),
		lu(t?.salePrice?.price),
		lu(t?.minAllowedPrice?.price),
		lu(t?.maxAllowedPrice?.price),
		lu(t?.businessPrice?.price),
		pu(t?.quantityDiscount ?? t?.businessPrice),
		lu(t?.maxRetailPrice?.price),
		lu(e.estimatedShipping),
		Y(t?.points ?? e.pricing?.points),
		Y(t?.automatedPricing?.enrollmentStatus ?? e.pricing?.automatedPricing?.enrollmentStatus),
		su(e.pricing?.taxData?.taxRate),
		su(e.pricing?.taxData?.taxExclusivePrice),
		su(e.pricing?.taxData?.taxExclusiveBusinessPrice),
		lu(r?.lowestPrice?.price),
		lu(r?.lowestPrice?.shipping),
		lu(r?.buyBoxPrice?.price),
		lu(r?.buyBoxPrice?.shipping),
		su(r?.salesRank?.rank),
		Y(r?.salesRank?.productCategory),
		lu(i?.price),
		lu(i?.shipping),
		Y(t?.businessProgram?.valueLabel ?? t?.businessProgram?.value),
		vu(t?.haulOffer, t?.haulOffer?.haulPrice?.price),
		vu(t?.ffoOffer, t?.ffoOffer?.ffoPrice?.price),
		vu(t?.nonAllOffer, t?.nonAllOffer?.nonAllPrice?.price),
		(e.actions ?? []).map((e) => e?.type).filter((e) => !!e).join(", "),
		Y(e.pointsCentralLink)
	];
}
function Su(e, t) {
	for (let n of e.parameters ?? []) if (n?.key === t && n.value) return n.value;
	return "";
}
function Cu(e) {
	let t = Su(e, "v3_flat_attribute_name") || Su(e, "attribute_name");
	if (t) return t.replace(/^\[|\]$/g, "");
	for (let t of e.issuePathForwards ?? []) for (let e of t?.attributes ?? []) if (e?.v3FlatPath) return e.v3FlatPath;
	return "";
}
function wu(e) {
	let t = (e ?? []).filter((e) => !!e), n = (e) => e.map((e) => e?.trim() ?? "").filter(Boolean).join(" || "), r = /* @__PURE__ */ new Set();
	for (let e of t) for (let t of e.tags ?? []) t && r.add(t);
	return {
		message: n(t.map((e) => e.localizedIssueMessage)),
		type: n(t.map((e) => e.type)),
		attribute: n(t.map(Cu)),
		enforcement: n(t.map((e) => (e.enforcementActions ?? []).filter(Boolean).join(", "))),
		source: n(t.map((e) => e.issueSource)),
		tags: [...r].join(", ")
	};
}
function Tu(e) {
	if (e.issuesFetchFailed) return [
		au,
		"",
		"",
		"",
		"",
		""
	];
	let t = wu(e.issues);
	return [
		t.message,
		t.type,
		t.attribute,
		t.enforcement,
		t.source,
		t.tags
	];
}
function Eu(e) {
	if (e.availability?.isQuantityInfinite) return !0;
	let t = e.availability?.quantity;
	return typeof t == "number" && Number.isFinite(t) && t !== 0;
}
function Du(e) {
	return e.filter(Eu);
}
function Ou(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([ru]), e.some((e) => e.issuesFetchFailed) && t.push([iu]), t.length && t.push([]), t;
}
function ku(e) {
	let t = Du(e);
	return [
		...Ou(e),
		[...ou],
		...t.map(xu)
	];
}
//#endregion
//#region src/lib/xlsxWorkbook.ts
var Au = /* @__PURE__ */ new Uint32Array(256);
for (let e = 0; e < 256; e += 1) {
	let t = e;
	for (let e = 0; e < 8; e += 1) t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
	Au[e] = t >>> 0;
}
function ju(e) {
	let t = 4294967295;
	for (let n of e) t = Au[(t ^ n) & 255] ^ t >>> 8;
	return (t ^ 4294967295) >>> 0;
}
function Mu(e, t, n) {
	e[t] = n & 255, e[t + 1] = n >>> 8 & 255;
}
function Nu(e, t, n) {
	e[t] = n & 255, e[t + 1] = n >>> 8 & 255, e[t + 2] = n >>> 16 & 255, e[t + 3] = n >>> 24 & 255;
}
function Pu(e) {
	return new TextEncoder().encode(e);
}
var Fu = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
function Iu(e) {
	return e.replace(Fu, "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;");
}
function Lu(e) {
	let t = "", n = e + 1;
	for (; n > 0;) {
		let e = (n - 1) % 26;
		t = String.fromCharCode(65 + e) + t, n = Math.floor((n - 1) / 26);
	}
	return t;
}
var Ru = 7, zu = 5, Bu = Ru, Vu = 600, Hu = /* @__PURE__ */ new Set("ijl.,;:'!|`"), Uu = /* @__PURE__ */ new Set("frtI()[]{}");
function Wu(e) {
	if (e === " " || e === "	") return 4;
	if (e >= "0" && e <= "9") return Ru;
	if (Hu.has(e)) return 4;
	if (Uu.has(e)) return 5;
	if (e >= "a" && e <= "z") return e === "m" || e === "w" ? 11 : 7;
	if (e >= "A" && e <= "Z") return e === "M" || e === "W" ? 12 : 8;
	let t = e.codePointAt(0) ?? 0;
	return t >= 4352 && t <= 4447 || t >= 11904 && t <= 42191 || t >= 44032 && t <= 55203 || t >= 63744 && t <= 64255 || t >= 65040 && t <= 65135 || t >= 65281 && t <= 65376 || t >= 65504 && t <= 65510 || t >= 127744 ? 14 : 8;
}
function Z(e) {
	let t = 0;
	for (let n of e) t += Wu(n);
	return t;
}
function Gu(e) {
	let t = 0;
	for (let n of String(e).split(/\r\n|\n|\r/)) t = Math.max(t, Z(n));
	return t;
}
function Ku(e) {
	let t = Math.trunc(e / 100), n = e % 100;
	return n === 0 ? String(t) : n % 10 == 0 ? `${t}.${n / 10}` : `${t}.${String(n).padStart(2, "0")}`;
}
function qu(e) {
	return Ku(Math.floor((Math.min(e, Vu) - zu) * 100 / Ru));
}
function Ju(e) {
	return Ku(Math.ceil((Math.min(Math.max(e, zu), Vu) - zu) * 100 / Ru));
}
function Yu(e, t) {
	let n = e.reduce((e, t) => Math.max(e, t.length), 0);
	for (let e of t.keys()) n = Math.max(n, e + 1);
	let r = Array(n).fill(0);
	for (let t of e) t.forEach((e, t) => {
		r[t] = Math.max(r[t], Gu(e));
	});
	let i = [];
	return r.forEach((e, n) => {
		let r = t.get(n);
		if (r == null && e <= 0) return;
		let a = r == null ? qu(Math.min(e + zu + Bu, Vu)) : Ju(r), o = n + 1;
		i.push(`<col min="${o}" max="${o}" width="${a}" customWidth="1"/>`);
	}), i.length === 0 ? "" : `<cols>${i.join("")}</cols>`;
}
var Xu = 0, Zu = 1, Qu = 2, $u = /* @__PURE__ */ new Set([
	"SKU",
	"MSKU",
	"MSKUs",
	"Product Name",
	"Title",
	"Product",
	"Other Actions",
	"Additional Notes"
]), ed = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>", td = "http://schemas.openxmlformats.org/spreadsheetml/2006/main", nd = "http://schemas.openxmlformats.org/package/2006/relationships", rd = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", id = "application/vnd.openxmlformats-officedocument.spreadsheetml", ad = [
	ed,
	`<styleSheet xmlns="${td}">`,
	"<fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font></fonts>",
	"<fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills>",
	"<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>",
	"<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>",
	"<cellXfs count=\"3\">",
	"<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>",
	"<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"left\" vertical=\"center\"/></xf>",
	"<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\" wrapText=\"1\"/></xf>",
	"</cellXfs>",
	"<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>",
	"</styleSheet>"
].join("");
function od(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) n.forEach((e, n) => {
		typeof e == "string" && $u.has(e) && t.add(n);
	});
	return t;
}
function sd(e) {
	return typeof e == "string" && e.trim() === "";
}
function cd(e) {
	let t = Math.round(e * 72 / 96 * 100) / 100;
	return String(t);
}
function ld(e, t, n) {
	return sd(t) ? "" : typeof t == "number" && Number.isFinite(t) ? `<c r="${e}" s="${n}"><v>${String(t)}</v></c>` : `<c r="${e}" s="${n}" t="inlineStr"><is><t>${Iu(String(t))}</t></is></c>`;
}
function ud(e) {
	let t = e.rows ?? [], n = `${ed}<worksheet xmlns="${td}">`;
	if (t.length === 0) return `${n}<sheetData/></worksheet>`;
	let r = new Map((e.fixedColumns ?? []).map((e) => [e.index, e.widthPx])), i = new Set((e.fixedColumns ?? []).filter((e) => e.wrapHeader).map((e) => e.index)), a = od(t), o = t.map((t, n) => {
		let r = n + 1, o = t.map((e, t) => {
			let o = n === 0 ? i.has(t) ? Qu : Xu : a.has(t) ? Zu : Xu;
			return ld(`${Lu(t)}${r}`, e, o);
		}).join("");
		return `<row r="${r}"${n === 0 && e.headerRowHeightPx != null ? ` ht="${cd(e.headerRowHeightPx)}" customHeight="1"` : ""}>${o}</row>`;
	}).join("");
	return `${n}${Yu(t, r)}<sheetData>${o}</sheetData></worksheet>`;
}
function dd(e) {
	let t = [], n = [], r = 0;
	for (let i of e) {
		let e = Pu(i.name), a = ju(i.data), o = new Uint8Array(30 + e.length + i.data.length);
		Nu(o, 0, 67324752), Mu(o, 4, 20), Mu(o, 8, 0), Nu(o, 14, a), Nu(o, 18, i.data.length), Nu(o, 22, i.data.length), Mu(o, 26, e.length), o.set(e, 30), o.set(i.data, 30 + e.length), t.push(o);
		let s = new Uint8Array(46 + e.length);
		Nu(s, 0, 33639248), Mu(s, 4, 20), Mu(s, 6, 20), Nu(s, 16, a), Nu(s, 20, i.data.length), Nu(s, 24, i.data.length), Mu(s, 28, e.length), Nu(s, 42, r), s.set(e, 46), n.push(s), r += o.length;
	}
	let i = n.reduce((e, t) => e + t.length, 0), a = /* @__PURE__ */ new Uint8Array(22);
	Nu(a, 0, 101010256), Mu(a, 8, e.length), Mu(a, 10, e.length), Nu(a, 12, i), Nu(a, 16, r);
	let o = new Uint8Array(r + i + a.length), s = 0;
	for (let e of t) o.set(e, s), s += e.length;
	for (let e of n) o.set(e, s), s += e.length;
	return o.set(a, s), o;
}
function fd(e) {
	if (e.length === 0) throw Error("A workbook needs at least one worksheet.");
	let t = e.map((e, t) => {
		let n = t + 1;
		return {
			id: n,
			name: e.name,
			path: `xl/worksheets/sheet${n}.xml`,
			relId: `rId${n}`,
			xml: ud(e)
		};
	}), n = [
		ed,
		"<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
		"<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
		"<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
		`<Override PartName="/xl/workbook.xml" ContentType="${id}.sheet.main+xml"/>`,
		`<Override PartName="/xl/styles.xml" ContentType="${id}.styles+xml"/>`,
		...t.map((e) => `<Override PartName="/${e.path}" ContentType="${id}.worksheet+xml"/>`),
		"</Types>"
	].join(""), r = [
		ed,
		`<Relationships xmlns="${nd}">`,
		`<Relationship Id="rId1" Type="${rd}/officeDocument" Target="xl/workbook.xml"/>`,
		"</Relationships>"
	].join(""), i = [
		ed,
		`<workbook xmlns="${td}" xmlns:r="${rd}">`,
		"<sheets>",
		...t.map((e) => `<sheet name="${Iu(e.name)}" sheetId="${e.id}" r:id="${e.relId}"/>`),
		"</sheets>",
		"</workbook>"
	].join(""), a = `rId${t.length + 1}`, o = [
		ed,
		`<Relationships xmlns="${nd}">`,
		...t.map((e) => `<Relationship Id="${e.relId}" Type="${rd}/worksheet" Target="worksheets/sheet${e.id}.xml"/>`),
		`<Relationship Id="${a}" Type="${rd}/styles" Target="styles.xml"/>`,
		"</Relationships>"
	].join("");
	return dd([
		{
			name: "[Content_Types].xml",
			data: Pu(n)
		},
		{
			name: "_rels/.rels",
			data: Pu(r)
		},
		{
			name: "xl/workbook.xml",
			data: Pu(i)
		},
		{
			name: "xl/_rels/workbook.xml.rels",
			data: Pu(o)
		},
		{
			name: "xl/styles.xml",
			data: Pu(ad)
		},
		...t.map((e) => ({
			name: e.path,
			data: Pu(e.xml)
		}))
	]);
}
//#endregion
//#region src/lib/reports.ts
var pd = [
	"Daily Tasks",
	"Unfulfillable",
	"Stranded",
	"Suppressed",
	"Shipping Queue"
], md = /[/\\:*?"<>|]/g;
function hd(e) {
	return pc(e);
}
function gd(e) {
	return e.replace(md, " ").replace(/\s+/g, " ").trim() || "Unknown";
}
function _d(e, t = /* @__PURE__ */ new Date()) {
	return `${gd(e)} - ${hd(t)}.xlsx`;
}
function vd(e, t = /* @__PURE__ */ new Date()) {
	return `${gd(e)} - ${hd(t)} - Sheets.xlsx`;
}
function yd(e, t, n = `${t}s`) {
	return `${e} ${e === 1 ? t : n}`;
}
function Q(e) {
	let t = [], n = (e, n) => t.push({
		source: e,
		text: n
	}), r = (e, t) => e.filter(t).length, { unfulfillableListings: i, feedbacks: a, suppressedListings: o, shipments: s } = e;
	i.some((e) => e.listingsIncomplete) && n("unfulfillable", `Only ${yd(i.length, "unfulfillable listing")} loaded; Seller Central lists more.`);
	let c = r(i, (e) => e.removalFetchFailed);
	c && n("unfulfillable", `Removal status is missing for ${yd(c, "SKU")}.`), a.some((e) => e.feedbackIncomplete) && n("feedback", `Only ${yd(a.length, "feedback entry", "feedback entries")} loaded; Seller Central has more.`), o.some((e) => e.listingsIncomplete) && n("suppressed", "Some search-suppressed listings couldn’t be loaded.");
	let l = r(o, (e) => e.issuesFetchFailed);
	l && n("suppressed", `Suppression reasons are missing for ${yd(l, "SKU")}.`), s.some((e) => e.listingsIncomplete) && n("shippingQueue", "Some shipments couldn’t be listed.");
	let u = r(s, (e) => e.detailsFetchFailed);
	u && n("shippingQueue", `Details are missing for ${yd(u, "shipment")}.`);
	let d = r(s, (e) => xl(e.details));
	return d && n("shippingQueue", `SKU lines are incomplete for ${yd(d, "shipment")}.`), t;
}
function bd(e = {}) {
	let t = {
		"Daily Tasks": () => Wc(e.feedbacks ?? []),
		Unfulfillable: () => nu(e.unfulfillableListings ?? []),
		Stranded: () => J(e.strandedListings ?? []),
		Suppressed: () => ku(e.suppressedListings ?? []),
		"Shipping Queue": () => jl(e.shipments ?? [])
	};
	return pd.map((e) => ({
		name: e,
		rows: t[e]()
	}));
}
function xd(e = pd.map((e) => ({ name: e }))) {
	return fd(e);
}
function Sd(e, t, n = document) {
	let r = new ArrayBuffer(e.byteLength);
	new Uint8Array(r).set(e);
	let i = new Blob([r], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), a = URL.createObjectURL(i), o = n.createElement("a");
	o.href = a, o.download = t, o.tabIndex = -1, o.setAttribute("aria-hidden", "true"), o.style.position = "fixed", o.style.left = "-9999px", o.style.top = "0", n.body.append(o), o.click(), o.remove(), URL.revokeObjectURL(a);
}
//#endregion
//#region src/lib/sheetPaste.ts
var Cd = "JMG Outdoors", wd = [
	{ header: "Date" },
	{
		header: "MSKU",
		source: "SKU"
	},
	{
		header: "Product Name",
		source: "Title"
	},
	{
		header: "Carrier Damaged",
		source: "Carrier Damaged"
	},
	{
		header: "Customer Damaged",
		source: "Customer Damaged"
	},
	{
		header: "Defective",
		source: "Defective"
	},
	{
		header: "Expired",
		source: "Expired"
	},
	{
		header: "Warehouse Damaged",
		source: "Warehouse Damaged"
	},
	{
		header: "Total Quantity",
		source: "Unfulfillable"
	},
	{ header: "Action" },
	{ header: "Date of E-Mail" },
	{ header: "Removal Order ID" },
	{ header: "Case ID" },
	{ header: "Case Status" },
	{ header: "Additional Notes" }
], Td = { header: "Product" }, Ed = [
	{ header: "Date" },
	{
		header: "ASIN",
		source: "ASIN"
	},
	{
		header: "MSKU",
		source: "SKU"
	},
	{
		header: "Product Name",
		source: "Product Name"
	},
	{
		header: "Condition",
		source: "Condition"
	},
	{
		header: "Stranded Reason",
		source: "Stranded reason"
	},
	{ header: "Action" },
	{ header: "Other Actions" },
	{ header: "Date of E-Mail" },
	{ header: "Removal Order ID" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], Dd = [
	{ header: "Date" },
	{
		header: "Feedback Date",
		source: "Date",
		date: !0
	},
	{
		header: "Order ID",
		source: "Order ID"
	},
	{
		header: "Feedback Rating",
		source: "Rating"
	},
	{ header: "Action" },
	{ header: "Other Actions" },
	{ header: "Date of E-Mail" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], Od = [
	{ header: "Date" },
	{
		header: "MSKU",
		source: "SKU"
	},
	{
		header: "ASIN",
		source: "ASIN"
	},
	{
		header: "Product Name",
		source: "Title"
	},
	{
		header: "Reason for Suppressed/LE",
		source: "Issue"
	},
	{ header: "Action" },
	{ header: "Other Actions" },
	{ header: "Date of E-Mail" },
	{ header: "Removal Order ID" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], kd = [
	{ header: "Date of Reconciliation" },
	{
		header: "Shipment Date",
		source: "Created Date",
		date: !0
	},
	{
		header: "Shipment ID",
		source: "Shipment ID"
	},
	{
		header: "SKU",
		source: "SKU"
	},
	{
		header: "Discrepancy",
		source: "Item Discrepancy Quantity"
	},
	{ header: "Required Document" },
	{ header: "Status" },
	{ header: "Action" },
	{ header: "Date of E-Mail" },
	{ header: "Reimbursement ID" },
	{ header: "Amount / Unit" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], Ad = Object.fromEntries(dc.map((e) => [e.toLowerCase(), e])), jd = Object.fromEntries(dc.map((e, t) => [String(t + 1).padStart(2, "0"), e])), Md = /^(\d{2})-([A-Za-z]{3}|\d{2})-(\d{4})/, $ = "Multiple Actions Applicable - Refer to Additional Notes for Details", Nd = "Manual Removal Order Created", Pd = "Scheduled for Removal", Fd = "Temporarily Unavailable for Removal", Id = "Manual Removal Created and Temporarily Unavailable", Ld = "Manual Removal Order Created and Scheduled for Removal", Rd = "Scheduled for Removal and Temporarily Unavailable", zd = "Damaged at the FC - For Monitoring", Bd = "Temporarily Unavailable", Vd = "N/A", Hd = "Not Applicable", Ud = [
	"Action",
	"Other Actions",
	"Date of E-Mail",
	"Removal Order ID",
	"Case ID"
], Wd = /* @__PURE__ */ new Set([
	"Carrier Damaged",
	"Customer Damaged",
	"Defective",
	"Expired",
	"Warehouse Damaged",
	"Total Quantity"
]), Gd = 70, Kd = 32, qd = [Hl, "Available for Removal"], Jd = [ql.InventoryInPendingRequest, "Scheduled for Removal"], Yd = [ql.InventoryIsBound, "Temporarily Unavailable for Removal"], Xd = [ql.InventoryIsWarehouseDamaged, "Damaged in the Fulfillment Center"], Zd = [
	ql.InventoryInUnsupportedFc,
	ql.InventoryInUnsupportedBzFc,
	ql.InventoryInPickupRemovalUnsupportedFc,
	"In location that can not process Removal"
];
function Qd(e) {
	return gd(e) === Cd ? [
		wd[0],
		Td,
		...wd.slice(1)
	] : wd;
}
function $d(e) {
	return e.flatMap((e, t) => typeof e == "string" && Wd.has(e) ? [{
		index: t,
		widthPx: Gd,
		wrapHeader: !0
	}] : []);
}
function ef(e) {
	return pc(new Date(e.getFullYear(), e.getMonth(), e.getDate() - 1));
}
function tf(e) {
	if (typeof e != "string") return e;
	let t = Md.exec(e);
	if (!t) return e;
	let n = Ad[t[2].toLowerCase()] ?? jd[t[2]];
	return n ? `${t[1]}-${n}-${t[3]}` : e;
}
function nf(e, t) {
	return e.findIndex((e) => t.every((t, n) => e[n] === t));
}
function rf(e, t, n) {
	let r = nf(e, t);
	if (r < 0) return [];
	let i = e[r].findIndex((e) => e === n);
	return i < 0 ? [] : e.slice(r + 1).map((e) => {
		let t = e[i];
		return t == null || t === "" ? "" : t;
	});
}
function af(e, t) {
	return e.map((e, n) => {
		if (n === 0) return e;
		let r = [...e];
		return r[0] = t, r;
	});
}
function of(e) {
	return e.split(/\s*\|\|\s*/).map((e) => e.trim()).filter(Boolean);
}
function sf(e, t) {
	return t.some((t) => e.includes(t));
}
function cf(e) {
	let t = of(e), n = t.some((e) => sf(e, qd)), r = t.some((e) => sf(e, Jd)), i = t.some((e) => sf(e, Yd)), a = t.some((e) => sf(e, Xd)), o = t.some((e) => sf(e, Zd));
	return t.length > 2 || a && t.length > 1 ? $ : n && i ? Id : n && r ? Ld : r && i ? Rd : n ? Nd : r ? Pd : i ? Fd : o ? Bd : a ? zd : $;
}
function lf(e, t) {
	return of(e).some((e) => sf(e, qd)) && t ? t : Vd;
}
function uf(e, t, n) {
	if (e.length === 0) return e;
	let r = e[0], i = r.indexOf("Action"), a = r.indexOf("Date of E-Mail"), o = r.indexOf("Removal Order ID"), s = r.indexOf("Case ID"), c = r.indexOf("Case Status"), l = r.indexOf("Additional Notes");
	return e.map((e, r) => {
		if (r === 0) return e;
		let u = [...e], d = String(t[r - 1] ?? "");
		return i >= 0 && (u[i] = cf(d)), a >= 0 && (u[a] = Vd), o >= 0 && (u[o] = lf(d, n)), s >= 0 && (u[s] = Vd), c >= 0 && (u[c] = Hd), l >= 0 && (u[l] = d), u;
	});
}
function df(e) {
	if (e.length === 0) return e;
	let t = e[0], n = Ud.map((e) => t.indexOf(e)).filter((e) => e >= 0), r = t.indexOf("Case Status");
	return e.map((e, t) => {
		if (t === 0) return e;
		let i = [...e];
		for (let e of n) i[e] = Vd;
		return r >= 0 && (i[r] = Hd), i;
	});
}
function ff(e, t) {
	let n = [kd.map((e) => e.header)], r = "";
	for (let i of e) {
		let e = (i.details?.items ?? []).filter((e) => typeof e.totalDiscrepancyQuantity == "number" && e.totalDiscrepancyQuantity < 0), a = i.detailsFetchFailed === !0 || !i.details;
		for (let o of e) {
			let e = i.shipmentId?.trim() ?? "", s = e !== "" && e === r, c = o.totalDiscrepancyQuantity ?? 0, l = Ml({
				detailsFailed: a,
				shipmentIneligibilityReason: i.details?.ineligibilityReason,
				itemIneligibilityReason: o.ineligibilityReason,
				discrepancy: c,
				eligible: i.details?.eligible
			}), u = o.caseId?.trim() || Vd, d = o.merchantSKU?.trim() || Vd;
			n.push([
				t,
				s ? "" : tf(dl(i.createdDate)),
				s ? "" : e,
				d,
				c,
				a || i.documentsFetchFailed ? "N/A" : Nl(i.documentTypes, l),
				l,
				Vd,
				t,
				Vd,
				Vd,
				a ? Vd : u,
				Hd
			]), e && (r = e);
		}
	}
	return n;
}
function pf(e, t, n) {
	let r = nf(e, t), i = r >= 0 ? e[r] : t, a = /* @__PURE__ */ new Map();
	i.forEach((e, t) => {
		typeof e == "string" && !a.has(e) && a.set(e, t);
	});
	let o = r >= 0 ? e.slice(r + 1) : [];
	return [n.map((e) => e.header), ...o.map((e) => n.map((t) => {
		if (!t.source) return "";
		let n = a.get(t.source);
		if (n == null) return "";
		let r = e[n], i = r == null || r === "" ? "" : r;
		return t.date ? tf(i) : i;
	}))];
}
function mf(e) {
	let t = ef(e.generatedAt), n = nu(e.unfulfillableListings), r = (e) => af(e, t), i = r(uf(pf(n, Vl, Qd(e.storeName)), rf(n, Vl, "Removal Status"), e.nextRemovalOrderId));
	return [
		{
			name: "UnfulfillableDisposals",
			rows: i,
			fixedColumns: $d(i[0] ?? []),
			headerRowHeightPx: Kd
		},
		{
			name: "Stranded",
			rows: r(df(pf(J(e.strandedListings), Fl, Ed)))
		},
		{
			name: "Feedback",
			rows: r(df(pf(Hc(e.feedbacks.filter((e) => e.suppressed === !1)), Mc, Dd)))
		},
		{
			name: "SuppressedLE",
			rows: r(df(pf(ku(e.suppressedListings), ou, Od)))
		},
		{
			name: "Shipping Queue",
			rows: ff(e.shipments, t)
		}
	];
}
//#endregion
//#region src/lib/reportDownload.ts
function hf(e, t, n = document) {
	let r = xd(t === "sheets" ? mf(e) : bd(e)), i = t === "sheets" ? vd(e.storeName, e.generatedAt) : _d(e.storeName, e.generatedAt);
	return Sd(r, i, n), {
		fileName: i,
		bytes: r.byteLength
	};
}
//#endregion
//#region src/lib/settings.ts
var gf = [
	"open-case-ids",
	"open-shipment-ids",
	"search-skus",
	"time-out",
	"generate-reports",
	"accounts"
], _f = {
	"open-case-ids": !0,
	"open-shipment-ids": !0,
	"search-skus": !0,
	"time-out": !0,
	"generate-reports": !0,
	accounts: !0
}, vf = {
	staffName: "Dhylan Mapesos",
	business: "S4E",
	supervisor: "Lou",
	hoursWorked: "4",
	scheduledAccountsCompleted: "Yes",
	shortDailyUpdate: "",
	blockersOrRedFlags: "No",
	clientAccountName: "",
	issueType: "",
	waitingOnWhom: "",
	followUpNeeded: "No",
	escalatedToSupervisor: "No",
	supervisorReviewNeeded: "No",
	karenReviewNeeded: "No"
};
function yf(e) {
	return e && typeof e == "object" ? e : {};
}
function bf(e) {
	let t = yf(e), n = yf(t.features), r = yf(t.timeOutForm), i = { ..._f };
	for (let e of gf) {
		let t = n[e];
		typeof t == "boolean" && (i[e] = t);
	}
	let a = { ...vf };
	for (let e of Object.keys(vf)) {
		let t = r[e];
		typeof t == "string" && (a[e] = t);
	}
	return {
		features: i,
		timeOutForm: a
	};
}
function xf(e, t) {
	return !gf.includes(t) || e[t] !== !1;
}
function Sf(e, t) {
	return gf.every((n) => e[n] === t[n]);
}
//#endregion
//#region src/lib/shipmentIds.ts
var Cf = /(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi;
function wf(e) {
	return [...new Set((e.match(Cf) ?? []).map((e) => e.toUpperCase()))];
}
//#endregion
//#region src/lib/skuIds.ts
var Tf = 40;
function Ef(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e.split(/[\n\r,\t]+/u)) {
		let e = r.trim();
		!e || e.length > Tf || t.has(e) || (t.add(e), n.push(e));
	}
	return n;
}
//#endregion
//#region src/components/ui/progress.tsx
function Df({ className: e, value: t, ...n }) {
	let r = t == null, i = r ? 0 : Math.min(100, Math.max(0, t || 0));
	return /* @__PURE__ */ (0, z.jsxs)(io, {
		"data-slot": "progress",
		"data-indeterminate": r || void 0,
		className: R("relative h-1 w-full overflow-hidden rounded-full bg-muted", e),
		value: r ? null : t,
		...n,
		children: [/* @__PURE__ */ (0, z.jsx)(ao, {
			"data-slot": "progress-indicator",
			className: "size-full flex-1 bg-primary transition-transform duration-500 ease-out-expo motion-reduce:transition-none",
			style: { transform: `translateX(-${100 - i}%)` }
		}), /* @__PURE__ */ (0, z.jsx)("span", {
			"aria-hidden": "true",
			"data-slot": "progress-indeterminate",
			className: R("pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-primary motion-reduce:hidden", r ? "opacity-100" : "opacity-0 transition-opacity duration-300 ease-out")
		})]
	});
}
//#endregion
//#region src/components/ui/spinner.tsx
function Of({ className: e, ...t }) {
	return /* @__PURE__ */ (0, z.jsx)(A, {
		"data-slot": "spinner",
		role: "status",
		"aria-label": "Loading",
		className: R("size-4 animate-spin", e),
		...t
	});
}
//#endregion
//#region src/ReportProgressPanel.tsx
var kf = "Connecting to Seller Central…";
function Af(e) {
	return Js.find((t) => t.id === e)?.label ?? e;
}
function jf(e, t, n) {
	return e === "complete" && n ? /* @__PURE__ */ (0, z.jsx)(M, {
		"aria-hidden": "true",
		className: "size-4 text-warning"
	}) : e === "complete" ? /* @__PURE__ */ (0, z.jsx)(re, {
		"aria-hidden": "true",
		className: "size-4 text-foreground"
	}) : e === "error" ? /* @__PURE__ */ (0, z.jsx)(ae, {
		"aria-hidden": "true",
		className: "size-4 text-destructive"
	}) : e === "active" && !t ? /* @__PURE__ */ (0, z.jsx)(Of, { className: "size-4" }) : /* @__PURE__ */ (0, z.jsx)(oe, {
		"aria-hidden": "true",
		className: R("size-4", e === "active" ? "text-foreground" : "text-muted-foreground/50")
	});
}
function Mf(e, t) {
	return t.status === "pending" ? 0 : nc({
		source: e,
		status: t.status === "error" ? "error" : t.status === "complete" ? "complete" : "active",
		loaded: t.loaded,
		total: t.total,
		phase: t.phase
	});
}
function Nf(e, t, n, r) {
	if (n) return "Report generation failed.";
	if (e.prepare === "active") return kf;
	if (tc(e, t) === "complete") return r.length ? `Report ready. ${r.map((e) => e.text).join(" ")}` : "Report ready.";
	let i = qs.filter((t) => e.sources[t].status === "active").map(Af);
	return i.length > 0 ? `${i.join(", ")}.` : "Generating report.";
}
function Pf(e, t, n) {
	if (e.prepare === "active") return t ? [] : [{
		id: "prepare",
		text: kf
	}];
	let r = [], i = [];
	for (let t of qs) {
		let n = e.sources[t];
		if (n.status === "error") {
			r.push({
				id: t,
				text: n.error ?? `${Af(t)} failed.`,
				tone: "error"
			});
			continue;
		}
		n.status === "active" && (n.loaded != null || n.total != null) && i.push({
			id: t,
			text: uc(t, n)
		});
	}
	return n.forEach((e, t) => r.push({
		id: `${e.source}-${t}`,
		text: e.text,
		tone: "warning"
	})), r.length > 0 ? r : i;
}
function Ff({ failed: e = !1, progress: t, submitting: n, warnings: r = [] }) {
	let i = Pf(t, e, r), a = i.some((e) => e.tone), o = new Set(r.map((e) => e.source));
	return /* @__PURE__ */ (0, z.jsxs)("div", {
		className: "grid gap-1 px-2 py-2",
		children: [
			/* @__PURE__ */ (0, z.jsx)("p", {
				"aria-live": "polite",
				className: "sr-only",
				children: Nf(t, n, e, r)
			}),
			/* @__PURE__ */ (0, z.jsx)("div", {
				className: "grid gap-0.5",
				role: "list",
				children: Js.map((n) => {
					let r = t.sources[n.id];
					return /* @__PURE__ */ (0, z.jsx)(If, {
						current: r.status === "active" && !e,
						label: n.label,
						partial: o.has(n.id),
						percent: Mf(n.id, r),
						status: r.status,
						stopped: e
					}, n.id);
				})
			}),
			/* @__PURE__ */ (0, z.jsx)("div", {
				className: R("flex min-h-4 min-w-0 px-1.5 text-xs text-muted-foreground", a ? "flex-col gap-0.5" : "items-center gap-3"),
				children: i.map((e) => /* @__PURE__ */ (0, z.jsx)("span", {
					className: R("min-w-0 truncate", e.tone === "error" && "text-destructive", e.tone === "warning" && "text-warning"),
					title: e.tone ? e.text : void 0,
					children: e.text
				}, e.id))
			})
		]
	});
}
function If({ current: e, label: t, partial: n, percent: r, status: i, stopped: a }) {
	let o = typeof r == "number" ? `${r}%` : null;
	return /* @__PURE__ */ (0, z.jsxs)("div", {
		"aria-current": e ? "step" : void 0,
		className: R("flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-150", e && "bg-muted/50"),
		role: "listitem",
		children: [
			/* @__PURE__ */ (0, z.jsx)("span", {
				className: "flex size-4 shrink-0 items-center justify-center",
				children: jf(i, a, n)
			}),
			/* @__PURE__ */ (0, z.jsx)("span", {
				className: R("min-w-0 flex-1 truncate text-sm", i === "pending" && "text-muted-foreground"),
				children: t
			}),
			/* @__PURE__ */ (0, z.jsx)(Df, {
				"aria-label": t,
				className: "h-1 w-16 shrink-0",
				value: i === "pending" || i === "error" || a ? r ?? 0 : r ?? null
			}),
			/* @__PURE__ */ (0, z.jsx)("span", {
				className: "w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground",
				children: o
			})
		]
	});
}
//#endregion
//#region src/CommandPalette.tsx
var Lf = 10, Rf = 50, zf = 1e3;
function Bf(e) {
	return e === "case-ids" || e === "shipment-ids" || e === "sku-ids";
}
function Vf(e, t) {
	return t.length === 1 ? `Open ${e} ${t[0]}` : `Open ${t.length} ${e} IDs`;
}
var Hf = {
	logout: "Signing out of the current account…",
	signin: "Opening Amazon sign-in…",
	email: "Entering the account email…",
	password: "Entering the password…",
	otp: "Entering the verification code…",
	paused: "Waiting for you to complete the CAPTCHA.",
	authenticated: "Opening the store…"
}, Uf = {
	initialized: !1,
	unlocked: !1,
	stores: []
};
async function Wf() {
	return Uf;
}
var Gf = [
	{
		heading: "Open",
		commands: [
			{
				id: "open-case-ids",
				label: "Open Case ID/s",
				icon: k,
				keywords: [
					"case",
					"cases",
					"ticket",
					"support"
				]
			},
			{
				id: "open-shipment-ids",
				label: "Open Shipment ID/s",
				icon: N,
				keywords: [
					"shipment",
					"shipments",
					"fba",
					"inbound",
					"transfer"
				]
			},
			{
				id: "search-skus",
				label: "Search SKU/s",
				icon: ce,
				keywords: [
					"sku",
					"skus",
					"asin",
					"msku",
					"listing",
					"product"
				]
			},
			{
				id: "time-out",
				label: "Time Out",
				icon: se,
				keywords: [
					"timeout",
					"time",
					"sheet",
					"form",
					"break"
				]
			}
		]
	},
	{
		heading: "Reports",
		commands: [{
			id: "generate-reports",
			label: "Generate Reports",
			icon: O,
			keywords: [
				"report",
				"xlsx",
				"export",
				"spreadsheet"
			]
		}]
	},
	{
		heading: "Configuration",
		commands: [{
			id: "accounts",
			label: "Accounts",
			icon: ne,
			keywords: [
				"account",
				"store",
				"stores",
				"switch",
				"login"
			]
		}]
	}
];
function Kf({ children: e, hidden: t, onDownload: n }) {
	let r = _.useRef(-Infinity);
	return /* @__PURE__ */ (0, z.jsx)(so, {
		"aria-hidden": t || void 0,
		className: R("px-3 active:not-aria-[haspopup]:translate-y-0", t ? "invisible pointer-events-none" : "animate-download-in motion-reduce:animate-none!"),
		disabled: t,
		onClick: (e) => {
			e.detail > 0 && performance.now() - r.current < zf || n();
		},
		onPointerDown: (e) => {
			e.button !== 0 || t || (e.preventDefault(), r.current = performance.now(), n());
		},
		size: "default",
		tabIndex: t ? -1 : void 0,
		type: "button",
		variant: "default",
		children: e
	});
}
function qf({ container: e, open: t, initialMode: n, onOpenCaseIds: r, onOpenShipmentIds: i, onOpenSkuIds: a = async () => void 0, onGetAccountsStatus: o = Wf, onUnlockAccounts: s = async () => void 0, onStartAccountSwitch: c = async () => void 0, onFocusCurrentStore: l = async () => void 0, onFocusAccountSwitch: u = async () => void 0, onCancelAccountSwitch: d = async () => void 0, onManageAccounts: f = async () => void 0, onPrepareReports: p = async () => ({ loggedInToStore: !0 }), onGenerateReports: m = async () => void 0, onDownloadReport: h = hf, onOpenTimeOut: g = async () => void 0, onOpenChange: v, enabledFeatures: y = _f }) {
	let [b, x] = _.useState(t && n && n !== "commands" ? n : "commands"), [S, C] = _.useState("case-ids"), [w, T] = _.useState(""), [ee, te] = _.useState(""), [E, D] = _.useState(""), [re, oe] = _.useState([]), [se, O] = _.useState(null), [A, j] = _.useState(!1), [M, ue] = _.useState(null), [de, fe] = _.useState(Ys), [pe, me] = _.useState(null), [he, ge] = _.useState([]), [_e, ve] = _.useState(), [ye, be] = _.useState(null), [xe, Se] = _.useState(!1), [Ce, we] = _.useState(!1), [Te, Ee] = _.useState(null), [De, Oe] = _.useState(""), [ke, Ae] = _.useState("none"), je = _.useRef(null), Me = _.useRef(0), Ne = _.useCallback(() => v(!1), [v]), Pe = _.useMemo(() => ({
		"case-ids": {
			ariaLabel: "Case IDs",
			description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
			extractIds: Ks,
			invalidError: "Enter at least one 11-digit Case ID.",
			noun: "case",
			placeholder: "Paste Case IDs here…\n\nEnter to open · Shift+Enter for a new line",
			submit: r,
			title: "Open Case IDs",
			unit: "case ID"
		},
		"shipment-ids": {
			ariaLabel: "Shipment IDs",
			description: "Enter one or more Amazon Seller Central FBA Shipment IDs.",
			extractIds: wf,
			invalidError: "Enter at least one valid FBA Shipment ID.",
			noun: "shipment",
			placeholder: "Paste Shipment IDs here…\n\nEnter to open · Shift+Enter for a new line",
			submit: i,
			title: "Open Shipment IDs",
			unit: "shipment ID"
		},
		"sku-ids": {
			ariaLabel: "SKUs",
			description: "Enter one or more Amazon Seller Central SKUs, one per line.",
			extractIds: Ef,
			invalidError: "Enter at least one SKU.",
			noun: "SKU",
			placeholder: "Paste SKUs here…\n\nEnter to open · Shift+Enter for a new line",
			submit: a,
			title: "Search SKUs",
			unit: "SKU"
		}
	}), [
		r,
		i,
		a
	]), Fe = Pe[S], Ie = _.useMemo(() => pe ? Q(pe) : [], [pe]), Le = _.useMemo(() => Gf.map((e) => ({
		...e,
		commands: e.commands.filter((e) => xf(y, e.id))
	})).filter((e) => e.commands.length > 0), [y]), Re = _.useMemo(() => Fe.extractIds(E), [E, Fe]), ze = _.useMemo(() => Ks(w), [w]), Be = _.useMemo(() => wf(w), [w]), Ve = w.trim(), He = xf(y, "accounts"), Ue = _.useMemo(() => !He || !Ve ? [] : he.filter((e) => _s(e.name, Ve) > 0), [
		He,
		Ve,
		he
	]), We = _.useMemo(() => !xf(y, "search-skus") || ze.length > 0 || Be.length > 0 || Ue.length > 0 || Ve.length < 1 || Ve.length > 40 || /\s/u.test(Ve) ? !1 : !Le.some((e) => e.commands.some((e) => _s(e.label, Ve, e.keywords) > 0)), [
		ze.length,
		Be.length,
		y,
		Ue.length,
		Ve,
		Le
	]);
	_.useEffect(() => {
		if (t) {
			n === "report-login" && x("report-login");
			return;
		}
		Me.current += 1, x("commands"), T(""), te(""), D(""), oe([]), O(null), j(!1), ue(null), fe(Ys), me(null), Ee(null), Oe("");
	}, [n, t]), _.useEffect(() => {
		if (!t || !He) return;
		let e = !1;
		return o().then((t) => {
			e || (ge(t.stores), ve(t.activeSwitch), be(t.currentStore ?? null), Se(!0), we(t.unlocked));
		}).catch(() => {}), () => {
			e = !0;
		};
	}, [
		He,
		o,
		t
	]), _.useEffect(() => {
		Bf(b) && je.current?.focus();
	}, [b]);
	let Ge = _.useCallback(() => {
		let e = je.current;
		if (!e) return Ae("none");
		Ae(ns(e));
	}, []);
	_.useLayoutEffect(() => {
		Bf(b) && Ge();
	}, [
		E,
		b,
		Ge
	]);
	let Ke = _.useCallback(async (e, t = S) => {
		let n = Pe[t];
		O(null), j(!0);
		try {
			await n.submit(e), Ne();
		} catch (e) {
			O(e instanceof Error ? e.message : `Couldn’t open ${n.noun} tabs. Please try again.`), j(!1);
		}
	}, [
		Ne,
		S,
		Pe
	]), qe = _.useCallback((e, t) => {
		if (!A) {
			if (C(e), t.length === 0) return O(Pe[e].invalidError);
			if (t.length > Rf) return O(`Open no more than ${Rf} IDs at a time.`);
			if (t.length > Lf) {
				oe(t), O(null), x("confirm-ids");
				return;
			}
			Ke(t, e);
		}
	}, [
		Pe,
		Ke,
		A
	]), Je = _.useCallback(() => {
		qe(S, Re);
	}, [
		Re,
		S,
		qe
	]), P = _.useCallback(async () => {
		O(null), ue("Loading accounts…"), j(!0);
		try {
			let e = await o();
			ge(e.stores), ve(e.activeSwitch), be(e.currentStore ?? null), Se(!0), we(e.unlocked), te(""), x("accounts");
		} catch (e) {
			O(e instanceof Error ? e.message : "Couldn’t load accounts. Please try again.");
		} finally {
			j(!1);
		}
	}, [o]), Ye = _.useCallback(async (e) => {
		O(null), j(!0);
		try {
			if (ye?.id === e.id) {
				await l(), Ne();
				return;
			}
			if (!Ce) {
				Ee(e), x("unlock"), j(!1);
				return;
			}
			await c(e.id), Ne();
		} catch (e) {
			O(e instanceof Error ? e.message : "Couldn’t start the account switch."), j(!1);
		}
	}, [
		Ce,
		Ne,
		ye,
		l,
		c
	]), Xe = _.useCallback(async () => {
		if (!(!Te || A)) {
			if (!De) return O("Enter your master password.");
			O(null), j(!0);
			try {
				await s(De), await c(Te.id), Ne();
			} catch (e) {
				O(e instanceof Error ? e.message : "Couldn’t unlock accounts."), j(!1);
			}
		}
	}, [
		Ne,
		De,
		c,
		s,
		Te,
		A
	]), Ze = _.useCallback(async () => {
		O(null), j(!0);
		try {
			await f(), Ne();
		} catch (e) {
			O(e instanceof Error ? e.message : "Couldn’t open account settings."), j(!1);
		}
	}, [Ne, f]), Qe = _.useCallback(async () => {
		let e = ++Me.current, t = () => e === Me.current;
		O(null), me(null), fe({
			...Ys,
			prepare: "active"
		}), x("generating-reports"), j(!0);
		try {
			let e = await p();
			if (!t()) return;
			if (!e.loggedInToStore) {
				if (j(!1), e.openedPromptOnSellerCentral) {
					Ne();
					return;
				}
				x("report-login");
				return;
			}
			fe((e) => ({
				...e,
				prepare: "complete",
				sources: {
					unfulfillable: { status: "active" },
					feedback: { status: "active" },
					stranded: { status: "active" },
					suppressed: { status: "active" },
					shippingQueue: { status: "active" }
				}
			}));
			let n = await m(xe ? ye?.name ?? "" : void 0, (e) => {
				t() && fe((t) => $s(t, e));
			});
			if (!t()) return;
			n && me(n), fe((e) => ({
				...e,
				workbook: "complete"
			})), j(!1);
		} catch (e) {
			if (!t()) return;
			O(e instanceof Error ? e.message : "Couldn’t generate the report. Please try again."), j(!1);
		}
	}, [
		xe,
		Ne,
		ye,
		m,
		p
	]), $e = _.useCallback(async () => {
		O(null), ue("Opening Time Out…"), j(!0);
		try {
			await g(), Ne();
		} catch (e) {
			O(e instanceof Error ? e.message : "Couldn’t open Time Out. Please try again."), j(!1);
		}
	}, [Ne, g]), et = _.useCallback((e) => {
		if (e === "open-case-ids") {
			C("case-ids"), x("case-ids");
			return;
		}
		if (e === "open-shipment-ids") {
			C("shipment-ids"), x("shipment-ids");
			return;
		}
		if (e === "search-skus") {
			C("sku-ids"), x("sku-ids");
			return;
		}
		if (e === "generate-reports") {
			Qe();
			return;
		}
		if (e === "time-out") {
			$e();
			return;
		}
		e === "accounts" && P();
	}, [
		Qe,
		P,
		$e
	]), tt = _.useCallback(async (e) => {
		O(null), j(!0);
		try {
			e === "focus" ? await u() : (await d(), ve(void 0));
		} catch (e) {
			O(e instanceof Error ? e.message : "Couldn’t update the account switch.");
		} finally {
			j(!1);
		}
	}, [d, u]), nt = _.useCallback(() => {
		Me.current += 1, x("commands"), O(null), me(null), fe(Ys);
	}, []), rt = _.useCallback((e) => {
		if (e.preventDefault(), !A) {
			if (O(null), b === "commands") return w ? T("") : v(!1);
			if (Bf(b)) return E ? D("") : x("commands");
			if (b === "confirm-ids") return x(S);
			if (b === "generating-reports") return nt();
			if (b === "report-login") return x("commands");
			if (b === "unlock") return De ? Oe("") : x("accounts");
			if (ee) return te("");
			x("commands");
		}
	}, [
		ee,
		w,
		E,
		S,
		De,
		b,
		v,
		nt,
		A
	]), F = {
		commands: {
			title: "Command Palette",
			description: "Search for a command to run."
		},
		accounts: {
			title: "Accounts",
			description: "Search stores or manage account switching."
		},
		unlock: {
			title: "Unlock Accounts",
			description: `Unlock to switch to ${Te?.name ?? "the selected store"}.`
		},
		"confirm-ids": {
			title: "Confirm Bulk Open",
			description: `Open ${re.length} ${Fe.noun} tabs.`
		},
		"report-login": {
			title: "Generate Reports",
			description: "Sign in to a Seller Central store to generate reports."
		},
		"generating-reports": {
			title: "Generate Reports",
			description: pe ? "Choose Raw or Sheets." : "Generating the Seller Central report."
		}
	}, { title: it, description: at } = Bf(b) ? Fe : F[b], ot = (e = "Back", t = nt) => /* @__PURE__ */ (0, z.jsx)("div", {
		className: "p-1 pb-0",
		children: /* @__PURE__ */ (0, z.jsxs)(so, {
			className: "active:not-aria-[haspopup]:translate-y-0",
			disabled: A,
			onClick: t,
			onPointerDown: (e) => {
				e.button === 0 && (e.preventDefault(), t());
			},
			size: "sm",
			type: "button",
			variant: "ghost",
			children: [/* @__PURE__ */ (0, z.jsx)(ie, { "aria-hidden": "true" }), e]
		})
	}), st = (e) => se ? /* @__PURE__ */ (0, z.jsxs)(Ht, {
		className: "mx-1 mb-1",
		id: e,
		variant: "destructive",
		children: [/* @__PURE__ */ (0, z.jsx)(ae, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)(Wt, { children: se })]
	}) : null;
	return /* @__PURE__ */ (0, z.jsx)("div", {
		className: "palette-scope",
		children: /* @__PURE__ */ (0, z.jsx)(Ls, {
			container: e,
			contentKey: b,
			description: at,
			open: t,
			onEscapeKeyDown: rt,
			onOpenChange: v,
			title: it,
			children: b === "commands" ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				/* @__PURE__ */ (0, z.jsx)(Rs, {
					autoFocus: !0,
					"aria-label": "Search commands",
					disabled: A,
					onValueChange: (e) => {
						T(e), O(null);
					},
					placeholder: "Type a command or store…",
					value: w
				}),
				A && M ? /* @__PURE__ */ (0, z.jsx)("p", {
					"aria-live": "polite",
					className: "px-2 py-1.5 text-sm text-muted-foreground",
					children: M
				}) : null,
				/* @__PURE__ */ (0, z.jsxs)(zs, {
					"aria-label": "Commands",
					children: [
						ze.length > 0 || Be.length > 0 || We || Ue.length > 0 ? null : /* @__PURE__ */ (0, z.jsx)(Bs, { children: "No results found." }),
						ze.length > 0 || Be.length > 0 ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [/* @__PURE__ */ (0, z.jsxs)(Vs, {
							forceMount: !0,
							heading: "Detected",
							children: [ze.length > 0 ? /* @__PURE__ */ (0, z.jsxs)(Us, {
								disabled: A,
								forceMount: !0,
								keywords: ze,
								onSelect: () => qe("case-ids", ze),
								value: Vf("case", ze),
								children: [/* @__PURE__ */ (0, z.jsx)(k, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: Vf("case", ze)
								})]
							}) : null, Be.length > 0 ? /* @__PURE__ */ (0, z.jsxs)(Us, {
								disabled: A,
								forceMount: !0,
								keywords: Be,
								onSelect: () => qe("shipment-ids", Be),
								value: Vf("shipment", Be),
								children: [/* @__PURE__ */ (0, z.jsx)(N, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: Vf("shipment", Be)
								})]
							}) : null]
						}), /* @__PURE__ */ (0, z.jsx)(Hs, { alwaysRender: !0 })] }) : null,
						Ue.length > 0 ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [/* @__PURE__ */ (0, z.jsx)(Vs, {
							forceMount: !0,
							heading: "Stores",
							children: Ue.map((e) => /* @__PURE__ */ (0, z.jsxs)(Us, {
								"data-checked": ye?.id === e.id || void 0,
								disabled: A,
								forceMount: !0,
								keywords: [e.name],
								onSelect: () => void Ye(e),
								value: `Switch to ${e.name}`,
								children: [/* @__PURE__ */ (0, z.jsx)(ne, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: e.name
								})]
							}, e.id))
						}), /* @__PURE__ */ (0, z.jsx)(Hs, { alwaysRender: !0 })] }) : null,
						We ? /* @__PURE__ */ (0, z.jsx)(Vs, {
							forceMount: !0,
							heading: "Search",
							children: /* @__PURE__ */ (0, z.jsxs)(Us, {
								disabled: A,
								forceMount: !0,
								keywords: [Ve],
								onSelect: () => qe("sku-ids", [Ve]),
								value: `Search '${Ve}' as SKU`,
								children: [/* @__PURE__ */ (0, z.jsx)(ce, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsxs)("span", {
									className: "min-w-0 flex-1 truncate",
									children: [
										"Search '",
										Ve,
										"' as SKU"
									]
								})]
							})
						}) : null,
						Le.map((e, t) => /* @__PURE__ */ (0, z.jsxs)(_.Fragment, { children: [t ? /* @__PURE__ */ (0, z.jsx)(Hs, {}) : null, /* @__PURE__ */ (0, z.jsx)(Vs, {
							heading: e.heading,
							children: e.commands.map((e) => {
								let t = e.icon;
								return /* @__PURE__ */ (0, z.jsxs)(Us, {
									value: e.label,
									keywords: [...e.keywords],
									disabled: A,
									onSelect: () => et(e.id),
									children: [/* @__PURE__ */ (0, z.jsx)(t, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: e.label
									})]
								}, e.id);
							})
						})] }, e.heading))
					]
				}),
				st()
			] }) : b === "accounts" ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				ot(),
				_e ? /* @__PURE__ */ (0, z.jsxs)(Ht, {
					className: "mx-1 my-1",
					role: "status",
					children: [
						/* @__PURE__ */ (0, z.jsxs)(Ut, { children: ["Switching to ", _e.storeName] }),
						/* @__PURE__ */ (0, z.jsx)(Wt, { children: Hf[_e.stage] ?? _e.stage }),
						/* @__PURE__ */ (0, z.jsxs)("div", {
							className: "mt-2 flex gap-2",
							children: [/* @__PURE__ */ (0, z.jsx)(so, {
								disabled: A,
								onClick: () => void tt("focus"),
								size: "xs",
								type: "button",
								variant: "outline",
								children: "Go to login"
							}), /* @__PURE__ */ (0, z.jsx)(so, {
								disabled: A,
								onClick: () => void tt("cancel"),
								size: "xs",
								type: "button",
								variant: "destructive",
								children: "Cancel switch"
							})]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, z.jsxs)("p", {
					"aria-label": `Current store: ${ye?.name ?? "Unknown"}`,
					className: "px-2 py-1.5 text-xs font-medium text-muted-foreground",
					role: "status",
					children: ["Current store: ", ye?.name ?? "Unknown"]
				}),
				/* @__PURE__ */ (0, z.jsx)(Rs, {
					autoFocus: !0,
					"aria-label": "Search accounts",
					disabled: A,
					onValueChange: (e) => {
						te(e), O(null);
					},
					placeholder: "Search stores…",
					value: ee
				}),
				/* @__PURE__ */ (0, z.jsxs)(zs, {
					"aria-label": "Accounts",
					children: [
						/* @__PURE__ */ (0, z.jsx)(Bs, { children: "No matching stores." }),
						/* @__PURE__ */ (0, z.jsxs)(Vs, {
							heading: "Stores",
							children: [he.map((e) => /* @__PURE__ */ (0, z.jsxs)(Us, {
								"data-checked": ye?.id === e.id || void 0,
								disabled: A,
								onSelect: () => void Ye(e),
								value: e.name,
								children: [/* @__PURE__ */ (0, z.jsx)(ne, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: e.name
								})]
							}, e.id)), he.length === 0 ? /* @__PURE__ */ (0, z.jsx)("div", {
								className: "py-6 text-center text-sm text-muted-foreground",
								children: "No stores configured."
							}) : null]
						}),
						/* @__PURE__ */ (0, z.jsx)(Hs, {}),
						/* @__PURE__ */ (0, z.jsx)(Vs, {
							heading: "Configuration",
							children: /* @__PURE__ */ (0, z.jsxs)(Us, {
								value: "Manage Accounts",
								disabled: A,
								onSelect: () => void Ze(),
								children: [/* @__PURE__ */ (0, z.jsx)(le, { "aria-hidden": "true" }), /* @__PURE__ */ (0, z.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: "Manage Accounts"
								})]
							})
						})
					]
				}),
				st()
			] }) : b === "unlock" ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				ot("Accounts", () => {
					x("accounts"), O(null);
				}),
				/* @__PURE__ */ (0, z.jsxs)("form", {
					autoComplete: "off",
					className: "grid gap-4 px-2 pb-2",
					onSubmit: (e) => e.preventDefault(),
					children: [
						/* @__PURE__ */ (0, z.jsxs)("p", {
							className: "text-sm text-foreground",
							children: [
								"Unlock to switch to ",
								Te?.name,
								"."
							]
						}),
						/* @__PURE__ */ (0, z.jsxs)("div", {
							className: "grid gap-2",
							children: [/* @__PURE__ */ (0, z.jsx)(Ws, {
								htmlFor: "s4e-spotlight-vault-unlock",
								children: "Master password"
							}), /* @__PURE__ */ (0, z.jsx)(Ts, {
								autoFocus: !0,
								"aria-describedby": se ? "unlock-error" : void 0,
								"aria-invalid": !!se,
								autoComplete: "new-password",
								"data-1p-ignore": "true",
								"data-lpignore": "true",
								"data-bwignore": "true",
								"data-form-type": "other",
								disabled: A,
								id: "s4e-spotlight-vault-unlock",
								name: "s4e-spotlight-vault-unlock",
								type: "password",
								value: De,
								onChange: (e) => {
									Oe(e.target.value), O(null);
								},
								onKeyDown: (e) => {
									e.key === "Enter" && (e.preventDefault(), Xe());
								}
							})]
						}),
						/* @__PURE__ */ (0, z.jsx)(so, {
							className: "w-full",
							disabled: A,
							onClick: () => void Xe(),
							type: "button",
							children: A ? "Unlocking…" : "Unlock and switch"
						})
					]
				}),
				st("unlock-error")
			] }) : b === "confirm-ids" ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				ot("Back", () => {
					x(S), O(null);
				}),
				/* @__PURE__ */ (0, z.jsxs)(Ht, {
					className: "mx-1 mb-1",
					role: "status",
					children: [/* @__PURE__ */ (0, z.jsxs)(Ut, { children: [
						"Open ",
						re.length,
						" ",
						Fe.noun,
						" tabs in the background?"
					] }), /* @__PURE__ */ (0, z.jsx)(Wt, { children: "This may briefly use significant browser resources." })]
				}),
				/* @__PURE__ */ (0, z.jsxs)("div", {
					className: "flex gap-2 px-1 pb-1",
					children: [/* @__PURE__ */ (0, z.jsx)(so, {
						className: "flex-1",
						disabled: A,
						onClick: () => x(S),
						type: "button",
						variant: "outline",
						children: "Cancel"
					}), /* @__PURE__ */ (0, z.jsx)(so, {
						autoFocus: !0,
						className: "flex-1",
						disabled: A,
						onClick: () => void Ke(re),
						type: "button",
						children: A ? "Opening…" : `Open ${re.length} tabs`
					})]
				}),
				st()
			] }) : b === "generating-reports" ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				A ? null : ot(),
				/* @__PURE__ */ (0, z.jsx)(Ff, {
					failed: !!se,
					progress: de,
					submitting: A,
					warnings: Ie
				}),
				/* @__PURE__ */ (0, z.jsxs)("div", {
					className: "flex justify-center gap-2 px-2 pb-2",
					children: [/* @__PURE__ */ (0, z.jsx)(Kf, {
						hidden: !pe || !!se,
						onDownload: () => {
							pe && h(pe, "raw");
						},
						children: "Raw"
					}), /* @__PURE__ */ (0, z.jsx)(Kf, {
						hidden: !pe || !!se,
						onDownload: () => {
							pe && h(pe, "sheets");
						},
						children: "Sheets"
					})]
				}),
				st()
			] }) : b === "report-login" ? /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				ot(),
				/* @__PURE__ */ (0, z.jsxs)(Ht, {
					className: "mx-1 mb-1",
					children: [/* @__PURE__ */ (0, z.jsx)(Ut, { children: "Sign in to a Seller Central store" }), /* @__PURE__ */ (0, z.jsx)(Wt, { children: "Generate Reports needs an open Seller Central store. Sign in with Accounts, then try again." })]
				}),
				/* @__PURE__ */ (0, z.jsxs)("div", {
					className: "flex gap-2 px-1 pb-1",
					children: [/* @__PURE__ */ (0, z.jsx)(so, {
						className: "flex-1",
						disabled: A,
						onClick: nt,
						type: "button",
						variant: "outline",
						children: "Cancel"
					}), /* @__PURE__ */ (0, z.jsx)(so, {
						autoFocus: !0,
						className: "flex-1",
						disabled: A,
						onClick: () => void P(),
						type: "button",
						children: A ? "Loading…" : "Open Accounts"
					})]
				}),
				st()
			] }) : /* @__PURE__ */ (0, z.jsxs)(z.Fragment, { children: [
				ot(),
				/* @__PURE__ */ (0, z.jsx)("div", {
					className: "p-1 pb-0",
					children: /* @__PURE__ */ (0, z.jsx)(Ds, {
						className: "h-auto rounded-lg! border-input/30 bg-input/30 shadow-none!",
						children: /* @__PURE__ */ (0, z.jsx)(As, {
							ref: je,
							"aria-describedby": se ? "identifier-input-error" : "identifier-input-count",
							"aria-invalid": !!se,
							"aria-label": Fe.ariaLabel,
							className: "identifier-input scroll-fade no-scrollbar min-h-32",
							"data-fade-mask": ke,
							disabled: A,
							placeholder: Fe.placeholder,
							value: E,
							onChange: (e) => {
								D(e.target.value), O(null);
							},
							onScroll: Ge,
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									if (e.shiftKey || e.nativeEvent.isComposing) {
										e.stopPropagation();
										return;
									}
									e.preventDefault(), e.stopPropagation(), Je();
								}
							}
						})
					})
				}),
				/* @__PURE__ */ (0, z.jsxs)("div", {
					className: "flex items-center justify-between gap-2 px-2 py-1",
					children: [/* @__PURE__ */ (0, z.jsxs)("p", {
						id: "identifier-input-count",
						"aria-live": "polite",
						className: "m-0 text-xs text-muted-foreground",
						children: [
							Re.length,
							" unique ",
							Fe.unit,
							Re.length === 1 ? "" : "s"
						]
					}), /* @__PURE__ */ (0, z.jsx)(so, {
						disabled: A || Re.length === 0,
						onClick: Je,
						size: "sm",
						type: "button",
						children: A ? "Opening…" : "Open"
					})]
				}),
				st("identifier-input-error")
			] })
		})
	});
}
//#endregion
//#region src/lib/colorScheme.ts
function Jf(e, t = window) {
	let n = t.matchMedia?.("(prefers-color-scheme: dark)");
	if (!n) return () => void 0;
	let r = () => e.classList.toggle("dark", n.matches);
	return r(), n.addEventListener("change", r), () => n.removeEventListener("change", r);
}
//#endregion
//#region src/lib/shortcut.ts
function Yf(e) {
	let t = e.code === "Slash" || e.key === "/", n = e.metaKey || e.ctrlKey;
	return t && n && !e.altKey && !e.shiftKey;
}
//#endregion
//#region src/paletteApp.tsx
var Xf = "command-palette-extension-root", Zf = "data-s4e-palette-open", Qf = "__s4eSpotlightPasteGuard", $f = "geist-latin-wght-normal.woff2", ep = 120, tp = kc("palette");
typeof chrome < "u" && chrome.runtime?.id && Cc(Ac());
async function np(e) {
	let t = typeof chrome < "u" && typeof chrome.runtime?.getURL == "function" ? chrome.runtime.getURL($f) : "";
	if (t && !(typeof FontFace > "u" || !e.fonts)) try {
		let n = new FontFace("Geist Variable", `url("${t}")`, {
			display: "swap",
			style: "normal",
			weight: "100 900"
		});
		e.fonts.add(n), await n.load();
	} catch {}
}
function rp(e, t, n) {
	return new Promise((r) => {
		let i = !1, a = () => {
			i || (i = !0, r());
		};
		if (e.then(a, a), !n) {
			a();
			return;
		}
		n.setTimeout(a, t);
	});
}
function ip(e) {
	let t = [e.documentElement, e.body], n = t.map((e) => ({
		overflow: e.style.overflow,
		overflowX: e.style.overflowX,
		overflowY: e.style.overflowY
	}));
	for (let e of t) e.style.overflow = "hidden";
	return () => {
		t.forEach((e, t) => {
			let r = n[t];
			e.style.overflow = r.overflow, e.style.overflowX = r.overflowX, e.style.overflowY = r.overflowY;
		});
	};
}
function ap(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot?.activeElement;) t = t.shadowRoot.activeElement;
	return t instanceof HTMLElement ? t : null;
}
function op(e) {
	let t = parseFloat(e.defaultView?.getComputedStyle(e.documentElement).fontSize ?? "16");
	return !Number.isFinite(t) || t <= 0 ? 1 : 16 / t;
}
function sp(e, t) {
	let n = op(t);
	return e.style.zoom = String(n), n;
}
async function cp(e) {
	let t = await chrome.runtime.sendMessage(e);
	if (!t?.ok) throw Error(t?.error ?? "The background worker did not respond.");
	return t;
}
async function lp(e) {
	await cp({
		type: "OPEN_CASE_IDS",
		caseIds: e
	});
}
async function up(e) {
	await cp({
		type: "OPEN_SHIPMENT_IDS",
		shipmentIds: e
	});
}
async function dp(e) {
	await cp({
		type: "OPEN_SKU_IDS",
		skuIds: e
	});
}
async function fp() {
	await cp({ type: "OPEN_TIME_OUT" });
}
async function pp() {
	let e = await cp({ type: "ACCOUNTS_STATUS" });
	return {
		initialized: e.initialized,
		unlocked: e.unlocked,
		stores: e.stores,
		activeSwitch: e.activeSwitch,
		currentStore: e.currentStore ?? null
	};
}
async function mp(e) {
	await cp({
		type: "ACCOUNTS_UNLOCK",
		masterPassword: e
	});
}
async function hp(e) {
	await cp({
		type: "ACCOUNTS_START_SWITCH",
		storeId: e
	});
}
async function gp() {
	await cp({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" });
}
async function _p() {
	await cp({ type: "ACCOUNTS_FOCUS_SWITCH" });
}
async function vp() {
	await cp({ type: "ACCOUNTS_CANCEL_SWITCH" });
}
async function yp() {
	await cp({ type: "ACCOUNTS_OPEN_OPTIONS" });
}
async function bp() {
	if (typeof chrome > "u" || !chrome.runtime?.sendMessage) return bf(void 0);
	try {
		let e = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
		if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
		return bf(e.settings);
	} catch (e) {
		return tp.warn("settings.loadFailed", { error: Dc(e) }), bf(void 0);
	}
}
async function xp() {
	let e = await cp({ type: "REPORTS_PREPARE" });
	return {
		loggedInToStore: !!e.loggedInToStore,
		openedPromptOnSellerCentral: e.openedPromptOnSellerCentral
	};
}
async function Sp(e, t) {
	let n = (await cp({ type: e }))[t];
	return Array.isArray(n) ? n : [];
}
async function Cp() {
	let e = await cp({ type: "REPORTS_FETCH_UNFULFILLABLE" }), t = e.nextRemovalOrderId;
	return {
		listings: Array.isArray(e.listings) ? e.listings : [],
		nextRemovalOrderId: typeof t == "string" && t ? t : null
	};
}
var wp = /* @__PURE__ */ new Set();
function Tp(e) {
	return wp.add(e), () => {
		wp.delete(e);
	};
}
function Ep(e) {
	for (let t of wp) t(e);
}
async function Dp(e = /* @__PURE__ */ new Date(), t, n) {
	let r = n ? Tp(n) : () => void 0, i = tp.time("report.run"), a = {}, o = (e, t, r, i) => {
		let o = wc(), s = () => Math.round(wc() - o);
		return t.then((t) => (a[e] = {
			ms: s(),
			count: i(t)
		}, n?.({
			source: e,
			status: "complete"
		}), t), (t) => {
			let i = Ec(t, "Couldn’t load this report section.");
			return a[e] = {
				ms: s(),
				error: i
			}, tp.warn("report.sourceFailed", {
				source: e,
				error: Dc(t)
			}), n?.({
				source: e,
				status: "error",
				error: i
			}), r;
		});
	};
	try {
		let r = t === void 0 ? (await pp()).currentStore?.name ?? "" : t;
		for (let e of qs) n?.({
			source: e,
			status: "active"
		});
		let s = (e) => e.length, [c, l, u, d, f] = await Promise.all([
			o("unfulfillable", Cp(), {
				listings: [],
				nextRemovalOrderId: null
			}, (e) => e.listings.length),
			o("feedback", Sp("REPORTS_FETCH_FEEDBACK", "feedbacks"), [], s),
			o("stranded", Sp("REPORTS_FETCH_STRANDED", "listings"), [], s),
			o("suppressed", Sp("REPORTS_FETCH_SUPPRESSED", "listings"), [], s),
			o("shippingQueue", Sp("REPORTS_FETCH_SHIPPING_QUEUE", "shipments"), [], s)
		]), p = Object.entries(a), m = p.reduce((e, t) => !e || Number(t[1].ms) > Number(e[1].ms) ? t : e, void 0), h = {
			storeName: r,
			generatedAt: e,
			unfulfillableListings: c.listings,
			nextRemovalOrderId: c.nextRemovalOrderId,
			feedbacks: l,
			strandedListings: u,
			suppressedListings: d,
			shipments: f
		}, g = Q(h);
		return i({
			sources: a,
			slowest: m?.[0],
			failed: p.filter(([, e]) => e.error).map(([e]) => e),
			...g.length ? { warnings: g.map(({ source: e, text: t }) => `${e}: ${t}`) } : {}
		}), h;
	} catch (e) {
		throw i({
			error: Dc(e),
			sources: a
		}, "error"), e;
	} finally {
		r();
	}
}
function Op(e, t, n) {
	let r = tp.time("report.download", { format: t });
	try {
		let { bytes: i } = hf(e, t, n);
		r({ bytes: i });
	} catch (e) {
		throw r({ error: Dc(e) }, "error"), e;
	}
}
function kp({ document: e = window.document, shadowMode: t = "closed" } = {}) {
	if (e.getElementById(Xf)) return null;
	let n = e.createElement("div");
	n.id = Xf, n.setAttribute(Zf, "false"), n.style.cssText = [
		"all: initial",
		"position: fixed",
		"inset: 0",
		"z-index: 2147483647",
		"pointer-events: none"
	].join(";"), sp(n, e);
	let r = Jf(n, e.defaultView ?? window), i = n.attachShadow({ mode: t }), a = e.createElement("style");
	a.textContent = y, i.append(a);
	let o = e.createElement("div");
	o.className = "palette-scope", o.style.pointerEvents = "auto", i.append(o), (e.body ?? e.documentElement).append(n);
	let s = (0, v.createRoot)(o), c = !1, l = "commands", u = null, d = null, f = _f, p = 0, m = !1, h = !1, g = !1, b = np(e).finally(() => {
		h = !0;
	}), x = bp().then((e) => {
		g = !0, !Sf(f, e.features) && (f = e.features, c && S());
	}), S = () => {
		s?.render(/* @__PURE__ */ (0, z.jsx)(_.StrictMode, { children: /* @__PURE__ */ (0, z.jsx)(qf, {
			container: i,
			enabledFeatures: f,
			initialMode: l,
			open: c,
			onOpenCaseIds: lp,
			onOpenShipmentIds: up,
			onOpenSkuIds: dp,
			onGetAccountsStatus: pp,
			onUnlockAccounts: mp,
			onStartAccountSwitch: hp,
			onFocusCurrentStore: gp,
			onFocusAccountSwitch: _p,
			onCancelAccountSwitch: vp,
			onManageAccounts: yp,
			onPrepareReports: xp,
			onGenerateReports: (e, t) => Dp(/* @__PURE__ */ new Date(), e, t),
			onDownloadReport: (t, n) => Op(t, n, e),
			onOpenTimeOut: fp,
			onOpenChange: C
		}) }));
	}, C = (t, r = "commands") => {
		if (l = t ? r : "commands", t === c) {
			t && S();
			return;
		}
		let i = ++p;
		t ? (u = ap(e), d = ip(e)) : (d?.(), d = null), c = t, n.setAttribute(Zf, String(t)), n.style.pointerEvents = t ? "auto" : "none", t && sp(n, e);
		let a = () => {
			i === p && (S(), t && bp().then((e) => {
				c && (Sf(f, e.features) || (f = e.features, S()));
			}), t || requestAnimationFrame(() => u?.focus({ preventScroll: !0 })));
		};
		if (t && !m) {
			let t = wc();
			rp(Promise.all([b, x]), ep, e.defaultView).then(() => {
				if (m = !0, !h || !g) {
					let e = Math.round(wc() - t);
					tp.warn("palette.slowFirstOpen", {
						waitedMs: e,
						fontLoaded: h,
						settingsLoaded: g
					});
				}
				a();
			});
			return;
		}
		a();
	}, w = (e) => {
		Yf(e) && (e.preventDefault(), e.stopImmediatePropagation(), C(!c));
	};
	e.defaultView?.addEventListener("keydown", w, !0);
	let T = (e) => {
		Qs(e) && Ep(e);
	};
	return typeof chrome < "u" && chrome.runtime?.onMessage?.addListener(T), {
		host: n,
		shadowRoot: i,
		setOpen: C,
		destroy: () => {
			n.setAttribute(Zf, "false"), d?.(), d = null, e.defaultView?.removeEventListener("keydown", w, !0), typeof chrome < "u" && chrome.runtime?.onMessage?.removeListener(T), e.defaultView?.[Qf]?.destroy(), r(), s?.unmount(), s = null, n.remove();
		}
	};
}
//#endregion
export { vp as cancelAccountSwitch, _p as focusAccountSwitch, gp as focusCurrentStore, Dp as generateReports, pp as getAccountsStatus, op as getPaletteRemScale, bp as getSettings, np as loadPaletteFont, yp as manageAccounts, kp as mountCommandPalette, lp as openCaseIds, up as openShipmentIds, dp as openSkuIds, fp as openTimeOut, xp as prepareReports, hp as startAccountSwitch, Tp as subscribeReportProgress, mp as unlockAccounts };
