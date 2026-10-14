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
	function ne(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var re = /\/+/g;
	function ie(e, t) {
		return typeof e == "object" && e && e.key != null ? ne("" + e.key) : t.toString(36);
	}
	function ae(e) {
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
	function oe(e, r, i, a, o) {
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
				case d: return c = e._init, oe(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ie(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(re, "$&/") + "/"), oe(o, r, i, "", function(e) {
			return e;
		})) : o != null && (E(o) && (o = te(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(re, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ie(a, u), c += oe(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ie(a, u++), c += oe(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return oe(ae(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function D(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return oe(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function O(e) {
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
	var k = typeof reportError == "function" ? reportError : function(e) {
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
	}, A = {
		map: D,
		forEach: function(e, t, n) {
			D(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return D(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return D(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!E(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = A, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
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
			_init: O
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
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, k);
		} catch (e) {
			k(e);
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
				t !== null && ie(x, t.startTime - e);
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
								u !== null && ie(x, u.startTime - t), i = !1;
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
		var ne = new MessageChannel(), re = ne.port2;
		ne.port1.onmessage = te, E = function() {
			re.postMessage(null);
		};
	} else E = function() {
		_(te, 0);
	};
	function ie(t, n) {
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, ie(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, E()))), r;
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
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), C = Symbol.for("react.context"), w = Symbol.for("react.forward_ref"), T = Symbol.for("react.suspense"), ee = Symbol.for("react.suspense_list"), te = Symbol.for("react.memo"), E = Symbol.for("react.lazy"), ne = Symbol.for("react.activity"), re = Symbol.for("react.memo_cache_sentinel"), ie = Symbol.iterator;
	function ae(e) {
		return typeof e != "object" || !e ? null : (e = ie && e[ie] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var oe = Symbol.for("react.client.reference");
	function D(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === oe ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case T: return "Suspense";
			case ee: return "SuspenseList";
			case ne: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case C: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case w:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case te: return t = e.displayName || null, t === null ? D(e.type) || "Memo" : t;
			case E:
				t = e._payload, e = e._init;
				try {
					return D(e(t));
				} catch {}
		}
		return null;
	}
	var O = Array.isArray, k = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, A = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, se = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, ce = [], le = -1;
	function ue(e) {
		return { current: e };
	}
	function j(e) {
		0 > le || (e.current = ce[le], ce[le] = null, le--);
	}
	function M(e, t) {
		le++, ce[le] = e.current, e.current = t;
	}
	var de = ue(null), N = ue(null), fe = ue(null), pe = ue(null);
	function me(e, t) {
		switch (M(fe, t), M(N, e), M(de, null), t.nodeType) {
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
		j(de), M(de, e);
	}
	function he() {
		j(de), j(N), j(fe);
	}
	function ge(e) {
		e.memoizedState !== null && M(pe, e);
		var t = de.current, n = Hd(t, e.type);
		t !== n && (M(N, e), M(de, n));
	}
	function _e(e) {
		N.current === e && (j(de), j(N)), pe.current === e && (j(pe), Qf._currentValue = se);
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
	function Ye(e) {
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
	function Xe(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Ye(n))) : i = Ye(o) : i = Ye(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Ye(n))) : i = Ye(o)) : i = Ye(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Ze(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Qe(e, t) {
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
	function $e() {
		var e = Je;
		return Je <<= 1, !(Je & 62914560) && (Je = 4194304), e;
	}
	function et(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function tt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function nt(e, t, n, r, i, a) {
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
		r !== 0 && P(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function P(e, t, n) {
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
	function it(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : at(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function at(e) {
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
	function ot(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function st() {
		var e = A.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function ct(e, t) {
		var n = A.p;
		try {
			return A.p = e, t();
		} finally {
			A.p = n;
		}
	}
	var lt = Math.random().toString(36).slice(2), ut = "__reactFiber$" + lt, dt = "__reactProps$" + lt, ft = "__reactContainer$" + lt, pt = "__reactEvents$" + lt, F = "__reactListeners$" + lt, mt = "__reactHandles$" + lt, ht = "__reactResources$" + lt, gt = "__reactMarker$" + lt;
	function _t(e) {
		delete e[ut], delete e[dt], delete e[pt], delete e[F], delete e[mt];
	}
	function vt(e) {
		var t = e[ut];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[ft] || n[ut]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[ut]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function yt(e) {
		if (e = e[ut] || e[ft]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function bt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function I(e) {
		var t = e[ht];
		return t ||= e[ht] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function xt(e) {
		e[gt] = !0;
	}
	var St = /* @__PURE__ */ new Set(), Ct = {};
	function wt(e, t) {
		Tt(e, t), Tt(e + "Capture", t);
	}
	function Tt(e, t) {
		for (Ct[e] = t, e = 0; e < t.length; e++) St.add(t[e]);
	}
	var Et = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Dt = {}, Ot = {};
	function kt(e) {
		return Te.call(Ot, e) ? !0 : Te.call(Dt, e) ? !1 : Et.test(e) ? Ot[e] = !0 : (Dt[e] = !0, !1);
	}
	function At(e, t, n) {
		if (kt(t)) {
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
	function jt(e, t, n) {
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
	function Mt(e, t, n, r) {
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
	function Nt(e) {
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
	function Pt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Ft(e, t, n) {
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
	function It(e) {
		if (!e._valueTracker) {
			var t = Pt(e) ? "checked" : "value";
			e._valueTracker = Ft(e, t, "" + e[t]);
		}
	}
	function Lt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Pt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Rt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var L = /[\n"\\]/g;
	function zt(e) {
		return e.replace(L, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function R(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Nt(t)) : e.value !== "" + Nt(t) && (e.value = "" + Nt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Vt(e, o, Nt(n)) : Vt(e, o, Nt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Nt(s) : e.removeAttribute("name");
	}
	function Bt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				It(e);
				return;
			}
			n = n == null ? "" : "" + Nt(n), t = t == null ? n : "" + Nt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), It(e);
	}
	function Vt(e, t, n) {
		t === "number" && Rt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Ht(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Nt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Ut(e, t, n) {
		if (t != null && (t = "" + Nt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Nt(n);
	}
	function Wt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (O(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Nt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), It(e);
	}
	function Gt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Kt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function qt(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Kt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Jt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && qt(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && qt(e, o, t[o]);
	}
	function Yt(e) {
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
	var Xt = /* @__PURE__ */ new Map([
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
	]), Zt = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Qt(e) {
		return Zt.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function $t() {}
	var en = null;
	function tn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var nn = null, rn = null;
	function an(e) {
		var t = yt(e);
		if (t && (e = t.stateNode)) {
			var n = e[dt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (R(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + zt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[dt] || null;
								if (!a) throw Error(i(90));
								R(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Lt(r);
					}
					break a;
				case "textarea":
					Ut(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Ht(e, !!n.multiple, t, !1);
			}
		}
	}
	var on = !1;
	function sn(e, t, n) {
		if (on) return e(t, n);
		on = !0;
		try {
			return e(t);
		} finally {
			if (on = !1, (nn !== null || rn !== null) && (bu(), nn && (t = nn, e = rn, rn = nn = null, an(t), e))) for (t = 0; t < e.length; t++) an(e[t]);
		}
	}
	function cn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[dt] || null;
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
	var ln = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), un = !1;
	if (ln) try {
		var dn = {};
		Object.defineProperty(dn, "passive", { get: function() {
			un = !0;
		} }), window.addEventListener("test", dn, dn), window.removeEventListener("test", dn, dn);
	} catch {
		un = !1;
	}
	var fn = null, pn = null, mn = null;
	function hn() {
		if (mn) return mn;
		var e, t = pn, n = t.length, r, i = "value" in fn ? fn.value : fn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return mn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function gn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function _n() {
		return !0;
	}
	function vn() {
		return !1;
	}
	function yn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? _n : vn, this.isPropagationStopped = vn, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = _n);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = _n);
			},
			persist: function() {},
			isPersistent: _n
		}), t;
	}
	var bn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, xn = yn(bn), Sn = h({}, bn, {
		view: 0,
		detail: 0
	}), Cn = yn(Sn), wn, Tn, En, Dn = h({}, Sn, {
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
		getModifierState: Rn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== En && (En && e.type === "mousemove" ? (wn = e.screenX - En.screenX, Tn = e.screenY - En.screenY) : Tn = wn = 0, En = e), wn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Tn;
		}
	}), On = yn(Dn), kn = yn(h({}, Dn, { dataTransfer: 0 })), An = yn(h({}, Sn, { relatedTarget: 0 })), jn = yn(h({}, bn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Mn = yn(h({}, bn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Nn = yn(h({}, bn, { data: 0 })), Pn = {
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
	}, Fn = {
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
	}, In = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Ln(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = In[e]) ? !!t[e] : !1;
	}
	function Rn() {
		return Ln;
	}
	var zn = yn(h({}, Sn, {
		key: function(e) {
			if (e.key) {
				var t = Pn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = gn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Fn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Rn,
		charCode: function(e) {
			return e.type === "keypress" ? gn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? gn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Bn = yn(h({}, Dn, {
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
	})), Vn = yn(h({}, Sn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Rn
	})), Hn = yn(h({}, bn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Un = yn(h({}, Dn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Wn = yn(h({}, bn, {
		newState: 0,
		oldState: 0
	})), Gn = [
		9,
		13,
		27,
		32
	], Kn = ln && "CompositionEvent" in window, qn = null;
	ln && "documentMode" in document && (qn = document.documentMode);
	var Jn = ln && "TextEvent" in window && !qn, Yn = ln && (!Kn || qn && 8 < qn && 11 >= qn), Xn = " ", Zn = !1;
	function Qn(e, t) {
		switch (e) {
			case "keyup": return Gn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function $n(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var er = !1;
	function tr(e, t) {
		switch (e) {
			case "compositionend": return $n(t);
			case "keypress": return t.which === 32 ? (Zn = !0, Xn) : null;
			case "textInput": return e = t.data, e === Xn && Zn ? null : e;
			default: return null;
		}
	}
	function nr(e, t) {
		if (er) return e === "compositionend" || !Kn && Qn(e, t) ? (e = hn(), mn = pn = fn = null, er = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Yn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var rr = {
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
	function ir(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!rr[e.type] : t === "textarea";
	}
	function ar(e, t, n, r) {
		nn ? rn ? rn.push(r) : rn = [r] : nn = r, t = Ed(t, "onChange"), 0 < t.length && (n = new xn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var or = null, sr = null;
	function cr(e) {
		yd(e, 0);
	}
	function lr(e) {
		if (Lt(bt(e))) return e;
	}
	function ur(e, t) {
		if (e === "change") return t;
	}
	var dr = !1;
	if (ln) {
		var fr;
		if (ln) {
			var pr = "oninput" in document;
			if (!pr) {
				var mr = document.createElement("div");
				mr.setAttribute("oninput", "return;"), pr = typeof mr.oninput == "function";
			}
			fr = pr;
		} else fr = !1;
		dr = fr && (!document.documentMode || 9 < document.documentMode);
	}
	function hr() {
		or && (or.detachEvent("onpropertychange", gr), sr = or = null);
	}
	function gr(e) {
		if (e.propertyName === "value" && lr(sr)) {
			var t = [];
			ar(t, sr, e, tn(e)), sn(cr, t);
		}
	}
	function _r(e, t, n) {
		e === "focusin" ? (hr(), or = t, sr = n, or.attachEvent("onpropertychange", gr)) : e === "focusout" && hr();
	}
	function vr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return lr(sr);
	}
	function yr(e, t) {
		if (e === "click") return lr(t);
	}
	function br(e, t) {
		if (e === "input" || e === "change") return lr(t);
	}
	function xr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var z = typeof Object.is == "function" ? Object.is : xr;
	function Sr(e, t) {
		if (z(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Te.call(t, i) || !z(e[i], t[i])) return !1;
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
		for (var t = Rt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Rt(e.document);
		}
		return t;
	}
	function Dr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Or = ln && "documentMode" in document && 11 >= document.documentMode, kr = null, Ar = null, jr = null, Mr = !1;
	function Nr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Mr || kr == null || kr !== Rt(r) || (r = kr, "selectionStart" in r && Dr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), jr && Sr(jr, r) || (jr = r, r = Ed(Ar, "onSelect"), 0 < r.length && (t = new xn("onSelect", "select", null, t, n), e.push({
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
	ln && (Lr = document.createElement("div").style, "AnimationEvent" in window || (delete Fr.animationend.animation, delete Fr.animationiteration.animation, delete Fr.animationstart.animation), "TransitionEvent" in window || delete Fr.transitionend.transition);
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
		Kr.set(e, t), wt(t, [e]);
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
		else if (typeof e == "string") s = Uf(e, n, de.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case ne: return e = si(31, n, t, a), e.elementType = ne, e.lanes = o, e;
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
	var Mi = null, Ni = null, B = !1, Pi = null, Fi = !1, Ii = Error(i(519));
	function Li(e) {
		throw Ui(_i(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Ii;
	}
	function Ri(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[ut] = e, t[dt] = r, n) {
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
			case "textarea": Q("invalid", t), Wt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || Md(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = $t), t = !0) : t = !1, t || Li(e, !0);
	}
	function zi(e) {
		for (Mi = e.return; Mi;) switch (Mi.tag) {
			case 5:
			case 31:
			case 13:
				Fi = !1;
				return;
			case 27:
			case 3:
				Fi = !0;
				return;
			default: Mi = Mi.return;
		}
	}
	function Bi(e) {
		if (e !== Mi) return !1;
		if (!B) return zi(e), B = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || Ud(e.type, e.memoizedProps)), n = !n), n && Ni && Li(e), zi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ni = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ni = uf(e);
		} else t === 27 ? (t = Ni, Zd(e.type) ? (e = lf, lf = null, Ni = e) : Ni = t) : Ni = Mi ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Vi() {
		Ni = Mi = null, B = !1;
	}
	function Hi() {
		var e = Pi;
		return e !== null && ($l === null ? $l = e : $l.push.apply($l, e), Pi = null), e;
	}
	function Ui(e) {
		Pi === null ? Pi = [e] : Pi.push(e);
	}
	var Wi = ue(null), Gi = null, Ki = null;
	function qi(e, t, n) {
		M(Wi, t._currentValue), t._currentValue = n;
	}
	function Ji(e) {
		e._currentValue = Wi.current, j(Wi);
	}
	function Yi(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Xi(e, t, n, r) {
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
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Yi(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Yi(s, n, e), s = null;
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
	function Zi(e, t, n, r) {
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
					z(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === pe.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && Xi(t, e, n, r), t.flags |= 262144;
	}
	function Qi(e) {
		for (e = e.firstContext; e !== null;) {
			if (!z(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function $i(e) {
		Gi = e, Ki = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function ea(e) {
		return na(Gi, e);
	}
	function ta(e, t) {
		return Gi === null && $i(e), na(e, t);
	}
	function na(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Ki === null) {
			if (e === null) throw Error(i(308));
			Ki = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Ki = Ki.next = t;
		return n;
	}
	var ra = typeof AbortController < "u" ? AbortController : function() {
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
	}, ia = t.unstable_scheduleCallback, aa = t.unstable_NormalPriority, oa = {
		$$typeof: C,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function sa() {
		return {
			controller: new ra(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function ca(e) {
		e.refCount--, e.refCount === 0 && ia(aa, function() {
			e.controller.abort();
		});
	}
	var la = null, ua = 0, da = 0, fa = null;
	function pa(e, t) {
		if (la === null) {
			var n = la = [];
			ua = 0, da = dd(), fa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return ua++, t.then(ma, ma), t;
	}
	function ma() {
		if (--ua === 0 && la !== null) {
			fa !== null && (fa.status = "fulfilled");
			var e = la;
			la = null, da = 0, fa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ha(e, t) {
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
	var ga = k.S;
	k.S = function(e, t) {
		nu = Ae(), typeof t == "object" && t && typeof t.then == "function" && pa(e, t), ga !== null && ga(e, t);
	};
	var _a = ue(null);
	function va() {
		var e = _a.current;
		return e === null ? G.pooledCache : e;
	}
	function ya(e, t) {
		t === null ? M(_a, _a.current) : M(_a, t.pool);
	}
	function ba() {
		var e = va();
		return e === null ? null : {
			parent: oa._currentValue,
			pool: e
		};
	}
	var xa = Error(i(460)), Sa = Error(i(474)), Ca = Error(i(542)), wa = { then: function() {} };
	function Ta(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ea(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then($t, $t), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Aa(e), e;
			default:
				if (typeof t.status == "string") t.then($t, $t);
				else {
					if (e = G, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
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
					case "rejected": throw e = t.reason, Aa(e), e;
				}
				throw Oa = t, xa;
		}
	}
	function Da(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Oa = e, xa) : e;
		}
	}
	var Oa = null;
	function ka() {
		if (Oa === null) throw Error(i(459));
		var e = Oa;
		return Oa = null, e;
	}
	function Aa(e) {
		if (e === xa || e === Ca) throw Error(i(483));
	}
	var ja = null, Ma = 0;
	function Na(e) {
		var t = Ma;
		return Ma += 1, ja === null && (ja = []), Ea(ja, e, t);
	}
	function Pa(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Fa(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Ia(e) {
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
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === E && Da(i) === t.type) ? (t = a(t, n.props), Pa(t, n), t.return = e, t) : (t = di(n.type, n.key, n.props, null, e.mode, r), Pa(t, n), t.return = e, t);
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
					case _: return n = di(t.type, t.key, t.props, null, e.mode, n), Pa(n, t), n.return = e, n;
					case v: return t = hi(t, e.mode, n), t.return = e, t;
					case E: return t = Da(t), f(e, t, n);
				}
				if (O(t) || ae(t)) return t = fi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Na(t), n);
				if (t.$$typeof === C) return f(e, ta(e, t), n);
				Fa(e, t);
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
					case E: return n = Da(n), p(e, t, n, r);
				}
				if (O(n) || ae(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Na(n), r);
				if (n.$$typeof === C) return p(e, t, ta(e, n), r);
				Fa(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case E: return r = Da(r), m(e, t, n, r, i);
				}
				if (O(r) || ae(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Na(r), i);
				if (r.$$typeof === C) return m(e, t, n, ta(t, r), i);
				Fa(t, r);
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
			if (h === s.length) return n(i, d), B && Di(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return B && Di(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), B && Di(i, h), l;
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
			if (v.done) return n(a, h), B && Di(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return B && Di(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), B && Di(a, g), u;
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
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === E && Da(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Pa(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === y ? (c = fi(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = di(o.type, o.key, o.props, null, e.mode, c), Pa(c, o), c.return = e, e = c);
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
					case E: return o = Da(o), b(e, r, o, c);
				}
				if (O(o)) return h(e, r, o, c);
				if (ae(o)) {
					if (l = ae(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Na(o), c);
				if (o.$$typeof === C) return b(e, r, ta(e, o), c);
				Fa(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = pi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Ma = 0;
				var i = b(e, t, n, r);
				return ja = null, i;
			} catch (t) {
				if (t === xa || t === Ca) throw t;
				var a = si(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var La = Ia(!0), Ra = Ia(!1), za = !1;
	function Ba(e) {
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
	function Va(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Ha(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ua(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, W & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ii(e), ri(e, null, n), t;
		}
		return ei(e, r, t, n), ii(e);
	}
	function Wa(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, rt(e, n);
		}
	}
	function Ga(e, t) {
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
	var Ka = !1;
	function qa() {
		if (Ka) {
			var e = fa;
			if (e !== null) throw e;
		}
	}
	function Ja(e, t, n, r) {
		Ka = !1;
		var i = e.updateQueue;
		za = !1;
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
					f !== 0 && f === da && (Ka = !0), u !== null && (u = u.next = {
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
							case 2: za = !0;
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
	function Ya(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Xa(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ya(n[e], t);
	}
	var Za = ue(null), Qa = ue(0);
	function $a(e, t) {
		e = Gl, M(Qa, e), M(Za, t), Gl = e | t.baseLanes;
	}
	function eo() {
		M(Qa, Gl), M(Za, Za.current);
	}
	function to() {
		Gl = Qa.current, j(Za), j(Qa);
	}
	var no = ue(null), ro = null;
	function io(e) {
		var t = e.alternate;
		M(lo, lo.current & 1), M(no, e), ro === null && (t === null || Za.current !== null || t.memoizedState !== null) && (ro = e);
	}
	function ao(e) {
		M(lo, lo.current), M(no, e), ro === null && (ro = e);
	}
	function oo(e) {
		e.tag === 22 ? (M(lo, lo.current), M(no, e), ro === null && (ro = e)) : so(e);
	}
	function so() {
		M(lo, lo.current), M(no, no.current);
	}
	function co(e) {
		j(no), ro === e && (ro = null), j(lo);
	}
	var lo = ue(0);
	function uo(e) {
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
	var fo = 0, V = null, H = null, po = null, mo = !1, ho = !1, go = !1, _o = 0, vo = 0, yo = null, bo = 0;
	function xo() {
		throw Error(i(321));
	}
	function So(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!z(e[n], t[n])) return !1;
		return !0;
	}
	function Co(e, t, n, r, i, a) {
		return fo = a, V = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, k.H = e === null || e.memoizedState === null ? Bs : Vs, go = !1, a = n(r, i), go = !1, ho && (a = To(t, n, r, i)), wo(e), a;
	}
	function wo(e) {
		k.H = zs;
		var t = H !== null && H.next !== null;
		if (fo = 0, po = H = V = null, mo = !1, vo = 0, yo = null, t) throw Error(i(300));
		e === null || ic || (e = e.dependencies, e !== null && Qi(e) && (ic = !0));
	}
	function To(e, t, n, r) {
		V = e;
		var a = 0;
		do {
			if (ho && (yo = null), vo = 0, ho = !1, 25 <= a) throw Error(i(301));
			if (a += 1, po = H = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			k.H = Hs, o = t(n, r);
		} while (ho);
		return o;
	}
	function Eo() {
		var e = k.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? No(t) : t, e = e.useState()[0], (H === null ? null : H.memoizedState) !== e && (V.flags |= 1024), t;
	}
	function Do() {
		var e = _o !== 0;
		return _o = 0, e;
	}
	function Oo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function ko(e) {
		if (mo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			mo = !1;
		}
		fo = 0, po = H = V = null, ho = !1, vo = _o = 0, yo = null;
	}
	function Ao() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return po === null ? V.memoizedState = po = e : po = po.next = e, po;
	}
	function jo() {
		if (H === null) {
			var e = V.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = H.next;
		var t = po === null ? V.memoizedState : po.next;
		if (t !== null) po = t, H = e;
		else {
			if (e === null) throw V.alternate === null ? Error(i(467)) : Error(i(310));
			H = e, e = {
				memoizedState: H.memoizedState,
				baseState: H.baseState,
				baseQueue: H.baseQueue,
				queue: H.queue,
				next: null
			}, po === null ? V.memoizedState = po = e : po = po.next = e;
		}
		return po;
	}
	function Mo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function No(e) {
		var t = vo;
		return vo += 1, yo === null && (yo = []), e = Ea(yo, e, t), t = V, (po === null ? t.memoizedState : po.next) === null && (t = t.alternate, k.H = t === null || t.memoizedState === null ? Bs : Vs), e;
	}
	function Po(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return No(e);
			if (e.$$typeof === C) return ea(e);
		}
		throw Error(i(438, String(e)));
	}
	function Fo(e) {
		var t = null, n = V.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = V.alternate;
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
		}, n === null && (n = Mo(), V.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = re;
		return t.index++, n;
	}
	function Io(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Lo(e) {
		return Ro(jo(), H, e);
	}
	function Ro(e, t, n) {
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
				if (f === u.lane ? (fo & f) === f : (q & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === da && (d = !0);
					else if ((fo & p) === p) {
						u = u.next, p === da && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, V.lanes |= p, ql |= p;
					f = u.action, go && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, V.lanes |= f, ql |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !z(o, e.memoizedState) && (ic = !0, d && (n = fa, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function zo(e) {
		var t = jo(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			z(o, t.memoizedState) || (ic = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Bo(e, t, n) {
		var r = V, a = jo(), o = B;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !z((H || a).memoizedState, n);
		if (s && (a.memoizedState = n, ic = !0), a = a.queue, ds(Uo.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || po !== null && po.memoizedState.tag & 1) {
			if (r.flags |= 2048, os(9, { destroy: void 0 }, Ho.bind(null, r, a, n, t), null), G === null) throw Error(i(349));
			o || fo & 127 || Vo(r, t, n);
		}
		return n;
	}
	function Vo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = V.updateQueue, t === null ? (t = Mo(), V.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Ho(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Wo(t) && Go(e);
	}
	function Uo(e, t, n) {
		return n(function() {
			Wo(t) && Go(e);
		});
	}
	function Wo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !z(e, n);
		} catch {
			return !0;
		}
	}
	function Go(e) {
		var t = ni(e, 2);
		t !== null && hu(t, e, 2);
	}
	function Ko(e) {
		var t = Ao();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), go) {
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
			lastRenderedReducer: Io,
			lastRenderedState: e
		}, t;
	}
	function qo(e, t, n, r) {
		return e.baseState = n, Ro(e, H, typeof r == "function" ? r : Io);
	}
	function Jo(e, t, n, r, a) {
		if (Is(e)) throw Error(i(485));
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
			k.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Yo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Yo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = k.T, o = {};
			k.T = o;
			try {
				var s = n(i, r), c = k.S;
				c !== null && c(o, s), Xo(e, t, s);
			} catch (n) {
				Qo(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), k.T = a;
			}
		} else try {
			a = n(i, r), Xo(e, t, a);
		} catch (n) {
			Qo(e, t, n);
		}
	}
	function Xo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Zo(e, t, n);
		}, function(n) {
			return Qo(e, t, n);
		}) : Zo(e, t, n);
	}
	function Zo(e, t, n) {
		t.status = "fulfilled", t.value = n, $o(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Yo(e, n)));
	}
	function Qo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, $o(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function $o(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function es(e, t) {
		return t;
	}
	function ts(e, t) {
		if (B) {
			var n = G.formState;
			if (n !== null) {
				a: {
					var r = V;
					if (B) {
						if (Ni) {
							b: {
								for (var i = Ni, a = Fi; i.nodeType !== 8;) {
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
								Ni = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Li(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = Ao(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: es,
			lastRenderedState: t
		}, n.queue = r, n = Ns.bind(null, V, r), r.dispatch = n, r = Ko(!1), a = Fs.bind(null, V, !1, r.queue), r = Ao(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Jo.bind(null, V, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function ns(e) {
		return rs(jo(), H, e);
	}
	function rs(e, t, n) {
		if (t = Ro(e, t, es)[0], e = Lo(Io)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = No(t);
		} catch (e) {
			throw e === xa ? Ca : e;
		}
		else r = t;
		t = jo();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (V.flags |= 2048, os(9, { destroy: void 0 }, is.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function is(e, t) {
		e.action = t;
	}
	function as(e) {
		var t = jo(), n = H;
		if (n !== null) return rs(t, n, e);
		jo(), t = t.memoizedState, n = jo();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function os(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = V.updateQueue, t === null && (t = Mo(), V.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function ss() {
		return jo().memoizedState;
	}
	function cs(e, t, n, r) {
		var i = Ao();
		V.flags |= e, i.memoizedState = os(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function ls(e, t, n, r) {
		var i = jo();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		H !== null && r !== null && So(r, H.memoizedState.deps) ? i.memoizedState = os(t, a, n, r) : (V.flags |= e, i.memoizedState = os(1 | t, a, n, r));
	}
	function us(e, t) {
		cs(8390656, 8, e, t);
	}
	function ds(e, t) {
		ls(2048, 8, e, t);
	}
	function fs(e) {
		V.flags |= 4;
		var t = V.updateQueue;
		if (t === null) t = Mo(), V.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function ps(e) {
		var t = jo().memoizedState;
		return fs({
			ref: t,
			nextImpl: e
		}), function() {
			if (W & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function ms(e, t) {
		return ls(4, 2, e, t);
	}
	function hs(e, t) {
		return ls(4, 4, e, t);
	}
	function gs(e, t) {
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
	function _s(e, t, n) {
		n = n == null ? null : n.concat([e]), ls(4, 4, gs.bind(null, t, e), n);
	}
	function vs() {}
	function ys(e, t) {
		var n = jo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && So(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function bs(e, t) {
		var n = jo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && So(t, r[1])) return r[0];
		if (r = e(), go) {
			Ve(!0);
			try {
				e();
			} finally {
				Ve(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function xs(e, t, n) {
		return n === void 0 || fo & 1073741824 && !(q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = mu(), V.lanes |= e, ql |= e, n);
	}
	function Ss(e, t, n, r) {
		return z(n, t) ? n : Za.current === null ? !(fo & 42) || fo & 1073741824 && !(q & 261930) ? (ic = !0, e.memoizedState = n) : (e = mu(), V.lanes |= e, ql |= e, t) : (e = xs(e, n, r), z(e, t) || (ic = !0), e);
	}
	function Cs(e, t, n, r, i) {
		var a = A.p;
		A.p = a !== 0 && 8 > a ? a : 8;
		var o = k.T, s = {};
		k.T = s, Fs(e, !1, t, n);
		try {
			var c = i(), l = k.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Ps(e, t, ha(c, r), pu(e)) : Ps(e, t, r, pu(e));
		} catch (n) {
			Ps(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, pu());
		} finally {
			A.p = a, o !== null && s.types !== null && (o.types = s.types), k.T = o;
		}
	}
	function ws() {}
	function Ts(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Es(e).queue;
		Cs(e, a, t, se, n === null ? ws : function() {
			return Ds(e), n(r);
		});
	}
	function Es(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: se,
			baseState: se,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Io,
				lastRenderedState: se
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
				lastRenderedReducer: Io,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Ds(e) {
		var t = Es(e);
		t.next === null && (t = e.alternate.memoizedState), Ps(e, t.next.queue, {}, pu());
	}
	function Os() {
		return ea(Qf);
	}
	function ks() {
		return jo().memoizedState;
	}
	function As() {
		return jo().memoizedState;
	}
	function js(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = pu();
					e = Ha(n);
					var r = Ua(t, e, n);
					r !== null && (hu(r, t, n), Wa(r, t, n)), t = { cache: sa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function Ms(e, t, n) {
		var r = pu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Is(e) ? Ls(t, n) : (n = ti(e, t, n, r), n !== null && (hu(n, e, r), Rs(n, t, r)));
	}
	function Ns(e, t, n) {
		Ps(e, t, n, pu());
	}
	function Ps(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (Is(e)) Ls(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, z(s, o)) return ei(e, t, i, 0), G === null && $r(), !1;
			} catch {}
			if (n = ti(e, t, i, r), n !== null) return hu(n, e, r), Rs(n, t, r), !0;
		}
		return !1;
	}
	function Fs(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: dd(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Is(e)) {
			if (t) throw Error(i(479));
		} else t = ti(e, n, r, 2), t !== null && hu(t, e, 2);
	}
	function Is(e) {
		var t = e.alternate;
		return e === V || t !== null && t === V;
	}
	function Ls(e, t) {
		ho = mo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Rs(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, rt(e, n);
		}
	}
	var zs = {
		readContext: ea,
		use: Po,
		useCallback: xo,
		useContext: xo,
		useEffect: xo,
		useImperativeHandle: xo,
		useLayoutEffect: xo,
		useInsertionEffect: xo,
		useMemo: xo,
		useReducer: xo,
		useRef: xo,
		useState: xo,
		useDebugValue: xo,
		useDeferredValue: xo,
		useTransition: xo,
		useSyncExternalStore: xo,
		useId: xo,
		useHostTransitionStatus: xo,
		useFormState: xo,
		useActionState: xo,
		useOptimistic: xo,
		useMemoCache: xo,
		useCacheRefresh: xo
	};
	zs.useEffectEvent = xo;
	var Bs = {
		readContext: ea,
		use: Po,
		useCallback: function(e, t) {
			return Ao().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: ea,
		useEffect: us,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), cs(4194308, 4, gs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return cs(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			cs(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = Ao();
			t = t === void 0 ? null : t;
			var r = e();
			if (go) {
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
			var r = Ao();
			if (n !== void 0) {
				var i = n(t);
				if (go) {
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
			}, r.queue = e, e = e.dispatch = Ms.bind(null, V, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = Ao();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Ko(e);
			var t = e.queue, n = Ns.bind(null, V, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: vs,
		useDeferredValue: function(e, t) {
			return xs(Ao(), e, t);
		},
		useTransition: function() {
			var e = Ko(!1);
			return e = Cs.bind(null, V, e.queue, !0, !1), Ao().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = V, a = Ao();
			if (B) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), G === null) throw Error(i(349));
				q & 127 || Vo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, us(Uo.bind(null, r, o, e), [e]), r.flags |= 2048, os(9, { destroy: void 0 }, Ho.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = Ao(), t = G.identifierPrefix;
			if (B) {
				var n = Ei, r = Ti;
				n = (r & ~(1 << 32 - He(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = _o++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = bo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Os,
		useFormState: ts,
		useActionState: ts,
		useOptimistic: function(e) {
			var t = Ao();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = Fs.bind(null, V, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Fo,
		useCacheRefresh: function() {
			return Ao().memoizedState = js.bind(null, V);
		},
		useEffectEvent: function(e) {
			var t = Ao(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (W & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Vs = {
		readContext: ea,
		use: Po,
		useCallback: ys,
		useContext: ea,
		useEffect: ds,
		useImperativeHandle: _s,
		useInsertionEffect: ms,
		useLayoutEffect: hs,
		useMemo: bs,
		useReducer: Lo,
		useRef: ss,
		useState: function() {
			return Lo(Io);
		},
		useDebugValue: vs,
		useDeferredValue: function(e, t) {
			return Ss(jo(), H.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Lo(Io)[0], t = jo().memoizedState;
			return [typeof e == "boolean" ? e : No(e), t];
		},
		useSyncExternalStore: Bo,
		useId: ks,
		useHostTransitionStatus: Os,
		useFormState: ns,
		useActionState: ns,
		useOptimistic: function(e, t) {
			return qo(jo(), H, e, t);
		},
		useMemoCache: Fo,
		useCacheRefresh: As
	};
	Vs.useEffectEvent = ps;
	var Hs = {
		readContext: ea,
		use: Po,
		useCallback: ys,
		useContext: ea,
		useEffect: ds,
		useImperativeHandle: _s,
		useInsertionEffect: ms,
		useLayoutEffect: hs,
		useMemo: bs,
		useReducer: zo,
		useRef: ss,
		useState: function() {
			return zo(Io);
		},
		useDebugValue: vs,
		useDeferredValue: function(e, t) {
			var n = jo();
			return H === null ? xs(n, e, t) : Ss(n, H.memoizedState, e, t);
		},
		useTransition: function() {
			var e = zo(Io)[0], t = jo().memoizedState;
			return [typeof e == "boolean" ? e : No(e), t];
		},
		useSyncExternalStore: Bo,
		useId: ks,
		useHostTransitionStatus: Os,
		useFormState: as,
		useActionState: as,
		useOptimistic: function(e, t) {
			var n = jo();
			return H === null ? (n.baseState = e, [e, n.queue.dispatch]) : qo(n, H, e, t);
		},
		useMemoCache: Fo,
		useCacheRefresh: As
	};
	Hs.useEffectEvent = ps;
	function Us(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Ws = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Ha(r);
			i.payload = t, n != null && (i.callback = n), t = Ua(e, i, r), t !== null && (hu(t, e, r), Wa(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Ha(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ua(e, i, r), t !== null && (hu(t, e, r), Wa(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = pu(), r = Ha(n);
			r.tag = 2, t != null && (r.callback = t), t = Ua(e, r, n), t !== null && (hu(t, e, n), Wa(t, e, n));
		}
	};
	function Gs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Sr(n, r) || !Sr(i, a) : !0;
	}
	function Ks(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Ws.enqueueReplaceState(t, t.state, null);
	}
	function qs(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Js(e) {
		Yr(e);
	}
	function Ys(e) {
		console.error(e);
	}
	function Xs(e) {
		Yr(e);
	}
	function Zs(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Qs(e, t, n) {
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
	function $s(e, t, n) {
		return n = Ha(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Zs(e, t);
		}, n;
	}
	function ec(e) {
		return e = Ha(e), e.tag = 3, e;
	}
	function tc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Qs(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Qs(t, n, r), typeof i != "function" && (au === null ? au = /* @__PURE__ */ new Set([this]) : au.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function nc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Zi(t, n, a, !0), n = no.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return ro === null ? Du() : n.alternate === null && Kl === 0 && (Kl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === wa ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Gu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === wa ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Gu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Gu(e, r, a), Du(), !1;
		}
		if (B) return t = no.current, t === null ? (r !== Ii && (t = Error(i(423), { cause: r }), Ui(_i(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = _i(r, n), a = $s(e.stateNode, r, a), Ga(e, a), Kl !== 4 && (Kl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Ii && (e = Error(i(422), { cause: r }), Ui(_i(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = _i(o, n), Ql === null ? Ql = [o] : Ql.push(o), Kl !== 4 && (Kl = 2), t === null) return !0;
		r = _i(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = $s(n.stateNode, r, e), Ga(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (au === null || !au.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = ec(a), tc(a, e, n, r), Ga(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var rc = Error(i(461)), ic = !1;
	function ac(e, t, n, r) {
		t.child = e === null ? Ra(t, null, n, r) : La(t, e.child, n, r);
	}
	function oc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return $i(t), r = Co(e, t, n, o, a, i), s = Do(), e !== null && !ic ? (Oo(e, t, i), Ac(e, t, i)) : (B && s && ki(t), t.flags |= 1, ac(e, t, r, i), t.child);
	}
	function sc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ci(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, cc(e, t, a, r, i)) : (e = di(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !jc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Sr : n, n(o, r) && e.ref === t.ref) return Ac(e, t, i);
		}
		return t.flags |= 1, e = li(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function cc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Sr(a, r) && e.ref === t.ref) {
				if (ic = !1, t.pendingProps = r = a, jc(e, i)) e.flags & 131072 && (ic = !0);
				else return t.lanes = e.lanes, Ac(e, t, i);
			}
		}
		return gc(e, t, n, r, i);
	}
	function lc(e, t, n, r) {
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
				return dc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && ya(t, a === null ? null : a.cachePool), a === null ? eo() : $a(t, a), oo(t);
			else return r = t.lanes = 536870912, dc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && ya(t, null), eo(), so(t)) : (ya(t, a.cachePool), $a(t, a), so(t), t.memoizedState = null);
		return ac(e, t, i, n), t.child;
	}
	function uc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function dc(e, t, n, r, i) {
		var a = va();
		return a = a === null ? null : {
			parent: oa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && ya(t, null), eo(), oo(t), e !== null && Zi(e, t, r, !0), t.childLanes = i, null;
	}
	function fc(e, t) {
		return t = Tc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function pc(e, t, n) {
		return La(t, e.child, null, n), e = fc(t, t.pendingProps), e.flags |= 2, co(t), t.memoizedState = null, e;
	}
	function mc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (B) {
				if (r.mode === "hidden") return e = fc(t, r), t.lanes = 536870912, uc(null, e);
				if (ao(t), (e = Ni) ? (e = rf(e, Fi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: wi === null ? null : {
						id: Ti,
						overflow: Ei
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = mi(e), n.return = t, t.child = n, Mi = t, Ni = null)) : e = null, e === null) throw Li(t);
				return t.lanes = 536870912, null;
			}
			return fc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (ao(t), a) {
				if (t.flags & 256) t.flags &= -257, t = pc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (ic || Zi(e, t, n, !1), a = (n & e.childLanes) !== 0, ic || a) {
				if (r = G, r !== null && (s = it(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, ni(e, s), hu(r, e, s), rc;
				Du(), t = pc(e, t, n);
			} else e = o.treeContext, Ni = cf(s.nextSibling), Mi = t, B = !0, Pi = null, Fi = !1, e !== null && ji(t, e), t = fc(t, r), t.flags |= 4096;
			return t;
		}
		return e = li(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function hc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function gc(e, t, n, r, i) {
		return $i(t), n = Co(e, t, n, r, void 0, i), r = Do(), e !== null && !ic ? (Oo(e, t, i), Ac(e, t, i)) : (B && r && ki(t), t.flags |= 1, ac(e, t, n, i), t.child);
	}
	function _c(e, t, n, r, i, a) {
		return $i(t), t.updateQueue = null, n = To(t, r, n, i), wo(e), r = Do(), e !== null && !ic ? (Oo(e, t, a), Ac(e, t, a)) : (B && r && ki(t), t.flags |= 1, ac(e, t, n, a), t.child);
	}
	function vc(e, t, n, r, i) {
		if ($i(t), t.stateNode === null) {
			var a = ai, o = n.contextType;
			typeof o == "object" && o && (a = ea(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Ws, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Ba(t), o = n.contextType, a.context = typeof o == "object" && o ? ea(o) : ai, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Us(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Ws.enqueueReplaceState(a, a.state, null), Ja(t, r, a, i), qa(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = qs(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = ai, typeof u == "object" && u && (o = ea(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Ks(t, a, r, o), za = !1;
			var f = t.memoizedState;
			a.state = f, Ja(t, r, a, i), qa(), l = t.memoizedState, s || f !== l || za ? (typeof d == "function" && (Us(t, n, d, r), l = t.memoizedState), (c = za || Gs(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Va(e, t), o = t.memoizedProps, u = qs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = ai, typeof l == "object" && l && (c = ea(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Ks(t, a, r, c), za = !1, f = t.memoizedState, a.state = f, Ja(t, r, a, i), qa();
			var p = t.memoizedState;
			o !== d || f !== p || za || e !== null && e.dependencies !== null && Qi(e.dependencies) ? (typeof s == "function" && (Us(t, n, s, r), p = t.memoizedState), (u = za || Gs(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Qi(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, hc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = La(t, e.child, null, i), t.child = La(t, null, n, i)) : ac(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Ac(e, t, i), e;
	}
	function yc(e, t, n, r) {
		return Vi(), t.flags |= 256, ac(e, t, n, r), t.child;
	}
	var bc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function xc(e) {
		return {
			baseLanes: e,
			cachePool: ba()
		};
	}
	function Sc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Xl), e;
	}
	function Cc(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(lo.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (B) {
				if (a ? io(t) : so(t), (e = Ni) ? (e = rf(e, Fi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: wi === null ? null : {
						id: Ti,
						overflow: Ei
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = mi(e), n.return = t, t.child = n, Mi = t, Ni = null)) : e = null, e === null) throw Li(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (so(t), a = t.mode, c = Tc({
				mode: "hidden",
				children: c
			}, a), r = fi(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = xc(n), r.childLanes = Sc(e, s, n), t.memoizedState = bc, uc(null, r)) : (io(t), wc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (io(t), t.flags &= -257, t = Ec(e, t, n)) : t.memoizedState === null ? (so(t), c = r.fallback, a = t.mode, r = Tc({
				mode: "visible",
				children: r.children
			}, a), c = fi(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, La(t, e.child, null, n), r = t.child, r.memoizedState = xc(n), r.childLanes = Sc(e, s, n), t.memoizedState = bc, t = uc(null, r)) : (so(t), t.child = e.child, t.flags |= 128, t = null);
			else if (io(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Ui({
					value: r,
					source: null,
					stack: null
				}), t = Ec(e, t, n);
			} else if (ic || Zi(e, t, n, !1), s = (n & e.childLanes) !== 0, ic || s) {
				if (s = G, s !== null && (r = it(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, ni(e, r), hu(s, e, r), rc;
				af(c) || Du(), t = Ec(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, Ni = cf(c.nextSibling), Mi = t, B = !0, Pi = null, Fi = !1, e !== null && ji(t, e), t = wc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (so(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = li(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = fi(c, a, n, null), c.flags |= 2) : c = li(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, uc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = xc(n) : (a = c.cachePool, a === null ? a = ba() : (l = oa._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = Sc(e, s, n), t.memoizedState = bc, uc(e.child, r)) : (io(t), n = e.child, e = n.sibling, n = li(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function wc(e, t) {
		return t = Tc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Tc(e, t) {
		return e = si(22, e, null, t), e.lanes = 0, e;
	}
	function Ec(e, t, n) {
		return La(t, e.child, null, n), e = wc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Dc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Yi(e.return, t, n);
	}
	function Oc(e, t, n, r, i, a) {
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
	function kc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = lo.current, s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, M(lo, o), ac(e, t, r, n), r = B ? xi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Dc(e, n, t);
			else if (e.tag === 19) Dc(e, n, t);
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
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && uo(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Oc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && uo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Oc(t, !0, n, null, a, r);
				break;
			case "together":
				Oc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function Ac(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), ql |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Zi(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = li(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = li(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function jc(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Qi(e)));
	}
	function Mc(e, t, n) {
		switch (t.tag) {
			case 3:
				me(t, t.stateNode.containerInfo), qi(t, oa, e.memoizedState.cache), Vi();
				break;
			case 27:
			case 5:
				ge(t);
				break;
			case 4:
				me(t, t.stateNode.containerInfo);
				break;
			case 10:
				qi(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, ao(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (io(t), e = Ac(e, t, n), e === null ? null : e.sibling) : Cc(e, t, n) : (io(t), t.flags |= 128, null);
				io(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= (Zi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return kc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), M(lo, lo.current), r) break;
				return null;
			case 22: return t.lanes = 0, lc(e, t, n, t.pendingProps);
			case 24: qi(t, oa, e.memoizedState.cache);
		}
		return Ac(e, t, n);
	}
	function Nc(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) ic = !0;
			else {
				if (!jc(e, n) && !(t.flags & 128)) return ic = !1, Mc(e, t, n);
				ic = !!(e.flags & 131072);
			}
		} else ic = !1, B && t.flags & 1048576 && Oi(t, xi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Da(t.elementType), t.type = e, typeof e == "function") ci(e) ? (r = qs(e, r), t.tag = 1, t = vc(null, t, e, r, n)) : (t.tag = 0, t = gc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === w) {
								t.tag = 11, t = oc(null, t, e, r, n);
								break a;
							}
							if (a === te) {
								t.tag = 14, t = sc(null, t, e, r, n);
								break a;
							}
						}
						throw t = D(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return gc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = qs(r, t.pendingProps), vc(e, t, r, a, n);
			case 3:
				a: {
					if (me(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Va(e, t), Ja(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, qi(t, oa, r), r !== o.cache && Xi(t, [oa], n, !0), qa(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = yc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = _i(Error(i(424)), t), Ui(a), t = yc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Ni = cf(e.firstChild), Mi = t, B = !0, Pi = null, Fi = !0, n = Ra(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Vi(), r === a) {
							t = Ac(e, t, n);
							break a;
						}
						ac(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return hc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : B || (n = t.type, e = t.pendingProps, r = Bd(fe.current).createElement(n), r[ut] = t, r[dt] = e, Pd(r, n, e), xt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ge(t), e === null && B && (r = t.stateNode = ff(t.type, t.pendingProps, fe.current), Mi = t, Fi = !0, a = Ni, Zd(t.type) ? (lf = a, Ni = cf(r.firstChild)) : Ni = a), ac(e, t, t.pendingProps.children, n), hc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && B && ((a = r = Ni) && (r = tf(r, t.type, t.pendingProps, Fi), r === null ? a = !1 : (t.stateNode = r, Mi = t, Ni = cf(r.firstChild), Fi = !1, a = !0)), a || Li(t)), ge(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = Co(e, t, Eo, null, null, n), Qf._currentValue = a), hc(e, t), ac(e, t, r, n), t.child;
			case 6: return e === null && B && ((e = n = Ni) && (n = nf(n, t.pendingProps, Fi), n === null ? e = !1 : (t.stateNode = n, Mi = t, Ni = null, e = !0)), e || Li(t)), null;
			case 13: return Cc(e, t, n);
			case 4: return me(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = La(t, null, r, n) : ac(e, t, r, n), t.child;
			case 11: return oc(e, t, t.type, t.pendingProps, n);
			case 7: return ac(e, t, t.pendingProps, n), t.child;
			case 8: return ac(e, t, t.pendingProps.children, n), t.child;
			case 12: return ac(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, qi(t, t.type, r.value), ac(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, $i(t), a = ea(a), r = r(a), t.flags |= 1, ac(e, t, r, n), t.child;
			case 14: return sc(e, t, t.type, t.pendingProps, n);
			case 15: return cc(e, t, t.type, t.pendingProps, n);
			case 19: return kc(e, t, n);
			case 31: return mc(e, t, n);
			case 22: return lc(e, t, n, t.pendingProps);
			case 24: return $i(t), r = ea(oa), e === null ? (a = va(), a === null && (a = G, o = sa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Ba(t), qi(t, oa, a)) : ((e.lanes & n) !== 0 && (Va(e, t), Ja(t, null, null, n), qa()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, qi(t, oa, r), r !== a.cache && Xi(t, [oa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), qi(t, oa, r))), ac(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Pc(e) {
		e.flags |= 4;
	}
	function Fc(e, t, n, r, i) {
		if ((t = !!(e.mode & 32)) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (wu()) e.flags |= 8192;
				else throw Oa = wa, Sa;
			}
		} else e.flags &= -16777217;
	}
	function Ic(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) {
			if (wu()) e.flags |= 8192;
			else throw Oa = wa, Sa;
		}
	}
	function Lc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : $e(), e.lanes |= t, Zl |= t);
	}
	function Rc(e, t) {
		if (!B) switch (e.tailMode) {
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
	function zc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Bc(e, t, n) {
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
			case 14: return zc(t), null;
			case 1: return zc(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Ji(oa), he(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Bi(t) ? Pc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Hi())), zc(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Pc(t), o === null ? (zc(t), Fc(t, a, null, r, n)) : (zc(t), Ic(t, o))) : o ? o === e.memoizedState ? (zc(t), t.flags &= -16777217) : (Pc(t), zc(t), Ic(t, o)) : (e = e.memoizedProps, e !== r && Pc(t), zc(t), Fc(t, a, e, r, n)), null;
			case 27:
				if (_e(t), n = fe.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Pc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return zc(t), null;
					}
					e = de.current, Bi(t) ? Ri(t, e) : (e = ff(a, r, n), t.stateNode = e, Pc(t));
				}
				return zc(t), null;
			case 5:
				if (_e(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Pc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return zc(t), null;
					}
					if (o = de.current, Bi(t)) Ri(t, o);
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
						o[ut] = t, o[dt] = r;
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
						r && Pc(t);
					}
				}
				return zc(t), Fc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Pc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = fe.current, Bi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Mi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[ut] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Md(e.nodeValue, n)), e || Li(t, !0);
					} else e = Bd(e).createTextNode(r), e[ut] = t, t.stateNode = e;
				}
				return zc(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Bi(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[ut] = t;
						} else Vi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						zc(t), e = !1;
					} else n = Hi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (co(t), t) : (co(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return zc(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Bi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[ut] = t;
						} else Vi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						zc(t), a = !1;
					} else a = Hi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (co(t), t) : (co(t), null);
				}
				return co(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Lc(t, t.updateQueue), zc(t), null);
			case 4: return he(), e === null && Sd(t.stateNode.containerInfo), zc(t), null;
			case 10: return Ji(t.type), zc(t), null;
			case 19:
				if (j(lo), r = t.memoizedState, r === null) return zc(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) Rc(r, !1);
					else {
						if (Kl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = uo(e), o !== null) {
								for (t.flags |= 128, Rc(r, !1), e = o.updateQueue, t.updateQueue = e, Lc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) ui(n, e), n = n.sibling;
								return M(lo, lo.current & 1 | 2), B && Di(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && Ae() > ru && (t.flags |= 128, a = !0, Rc(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = uo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Lc(t, e), Rc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !B) return zc(t), null;
						} else 2 * Ae() - r.renderingStartTime > ru && n !== 536870912 && (t.flags |= 128, a = !0, Rc(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (zc(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Ae(), e.sibling = null, n = lo.current, M(lo, a ? n & 1 | 2 : n & 1), B && Di(t, r.treeForkCount), e);
			case 22:
			case 23: return co(t), to(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (zc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : zc(t), n = t.updateQueue, n !== null && Lc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && j(_a), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Ji(oa), zc(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Vc(e, t) {
		switch (Ai(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Ji(oa), he(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return _e(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (co(t), t.alternate === null) throw Error(i(340));
					Vi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (co(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Vi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return j(lo), null;
			case 4: return he(), null;
			case 10: return Ji(t.type), null;
			case 22:
			case 23: return co(t), to(), e !== null && j(_a), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Ji(oa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Hc(e, t) {
		switch (Ai(t), t.tag) {
			case 3:
				Ji(oa), he();
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
				t.memoizedState !== null && co(t);
				break;
			case 13:
				co(t);
				break;
			case 19:
				j(lo);
				break;
			case 10:
				Ji(t.type);
				break;
			case 22:
			case 23:
				co(t), to(), e !== null && j(_a);
				break;
			case 24: Ji(oa);
		}
	}
	function Uc(e, t) {
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
	function Wc(e, t, n) {
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
	function Gc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Xa(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Kc(e, t, n) {
		n.props = qs(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function qc(e, t) {
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
	function Jc(e, t) {
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
	function Yc(e) {
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
	function Xc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[dt] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Zc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4;
	}
	function Qc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Zc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function $c(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = $t));
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for ($c(e, t, n), e = e.sibling; e !== null;) $c(e, t, n), e = e.sibling;
	}
	function el(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (el(e, t, n), e = e.sibling; e !== null;) el(e, t, n), e = e.sibling;
	}
	function tl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[ut] = e, t[dt] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var nl = !1, rl = !1, il = !1, al = typeof WeakSet == "function" ? WeakSet : Set, ol = null;
	function sl(e, t) {
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
		}, sp = !1, ol = t; ol !== null;) if (t = ol, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, ol = e;
		else for (; ol !== null;) {
			switch (t = ol, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = qs(n.type, a);
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
				e.return = t.return, ol = e;
				break;
			}
			ol = t.return;
		}
	}
	function cl(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Sl(e, n), r & 4 && Uc(5, n);
				break;
			case 1:
				if (Sl(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Z(n, n.return, e);
					}
					else {
						var i = qs(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Z(n, n.return, e);
						}
					}
				}
				r & 64 && Gc(n), r & 512 && qc(n, n.return);
				break;
			case 3:
				if (Sl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Xa(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && tl(n);
			case 26:
			case 5:
				Sl(e, n), t === null && r & 4 && Yc(n), r & 512 && qc(n, n.return);
				break;
			case 12:
				Sl(e, n);
				break;
			case 31:
				Sl(e, n), r & 4 && ml(e, n);
				break;
			case 13:
				Sl(e, n), r & 4 && U(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = Ju.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || nl, !r) {
					t = t !== null && t.memoizedState !== null || rl, i = nl;
					var a = rl;
					nl = r, (rl = t) && !a ? wl(e, n, !!(n.subtreeFlags & 8772)) : Sl(e, n), nl = i, rl = a;
				}
				break;
			case 30: break;
			default: Sl(e, n);
		}
	}
	function ll(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, ll(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && _t(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var ul = null, dl = !1;
	function fl(e, t, n) {
		for (n = n.child; n !== null;) pl(e, t, n), n = n.sibling;
	}
	function pl(e, t, n) {
		if (Be && typeof Be.onCommitFiberUnmount == "function") try {
			Be.onCommitFiberUnmount(ze, n);
		} catch {}
		switch (n.tag) {
			case 26:
				rl || Jc(n, t), fl(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				rl || Jc(n, t);
				var r = ul, i = dl;
				Zd(n.type) && (ul = n.stateNode, dl = !1), fl(e, t, n), pf(n.stateNode), ul = r, dl = i;
				break;
			case 5: rl || Jc(n, t);
			case 6:
				if (r = ul, i = dl, ul = null, fl(e, t, n), ul = r, dl = i, ul !== null) {
					if (dl) try {
						(ul.nodeType === 9 ? ul.body : ul.nodeName === "HTML" ? ul.ownerDocument.body : ul).removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						ul.removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
				}
				break;
			case 18:
				ul !== null && (dl ? (e = ul, Qd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(ul, n.stateNode));
				break;
			case 4:
				r = ul, i = dl, ul = n.stateNode.containerInfo, dl = !0, fl(e, t, n), ul = r, dl = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Wc(2, n, t), rl || Wc(4, n, t), fl(e, t, n);
				break;
			case 1:
				rl || (Jc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Kc(n, t, r)), fl(e, t, n);
				break;
			case 21:
				fl(e, t, n);
				break;
			case 22:
				rl = (r = rl) || n.memoizedState !== null, fl(e, t, n), rl = r;
				break;
			default: fl(e, t, n);
		}
	}
	function ml(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Z(t, t.return, e);
			}
		}
	}
	function U(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function hl(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new al()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new al()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function gl(e, t) {
		var n = hl(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Yu.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function _l(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Zd(c.type)) {
							ul = c.stateNode, dl = !1;
							break a;
						}
						break;
					case 5:
						ul = c.stateNode, dl = !1;
						break a;
					case 3:
					case 4:
						ul = c.stateNode.containerInfo, dl = !0;
						break a;
				}
				c = c.return;
			}
			if (ul === null) throw Error(i(160));
			pl(o, s, a), ul = null, dl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) yl(t, e), t = t.sibling;
	}
	var vl = null;
	function yl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				_l(t, e), bl(e), r & 4 && (Wc(3, e, e.return), Uc(3, e), Wc(5, e, e.return));
				break;
			case 1:
				_l(t, e), bl(e), r & 512 && (rl || n === null || Jc(n, n.return)), r & 64 && nl && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = vl;
				if (_l(t, e), bl(e), r & 512 && (rl || n === null || Jc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) {
						if (r === null) {
							if (e.stateNode === null) {
								a: {
									r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
									b: switch (r) {
										case "title":
											o = a.getElementsByTagName("title")[0], (!o || o[gt] || o[ut] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[ut] = e, xt(o), r = o;
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
									o[ut] = e, xt(o), r = o;
								}
								e.stateNode = r;
							} else Hf(a, e.type, e.stateNode);
						} else e.stateNode = If(a, r, e.memoizedProps);
					} else o === r ? r === null && e.stateNode !== null && Xc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				_l(t, e), bl(e), r & 512 && (rl || n === null || Jc(n, n.return)), n !== null && r & 4 && Xc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (_l(t, e), bl(e), r & 512 && (rl || n === null || Jc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Gt(a, "");
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Xc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (il = !0);
				break;
			case 6:
				if (_l(t, e), bl(e), r & 4) {
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
				if (Bf = null, a = vl, vl = gf(t.containerInfo), _l(t, e), vl = a, bl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				il && (il = !1, xl(e));
				break;
			case 4:
				r = vl, vl = gf(e.stateNode.containerInfo), _l(t, e), bl(e), vl = r;
				break;
			case 12:
				_l(t, e), bl(e);
				break;
			case 31:
				_l(t, e), bl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, gl(e, r)));
				break;
			case 13:
				_l(t, e), bl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (tu = Ae()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, gl(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = nl, d = rl;
				if (nl = u || a, rl = d || l, _l(t, e), rl = d, nl = u, bl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || nl || rl || Cl(e)), n = null, t = e;;) {
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
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, gl(e, n))));
				break;
			case 19:
				_l(t, e), bl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, gl(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: _l(t, e), bl(e);
		}
	}
	function bl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Zc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						el(e, Qc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Gt(o, ""), n.flags &= -33), el(e, Qc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						$c(e, Qc(e), s);
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
	function xl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			xl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function Sl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) cl(e, t.alternate, t), t = t.sibling;
	}
	function Cl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Wc(4, t, t.return), Cl(t);
					break;
				case 1:
					Jc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Kc(t, t.return, n), Cl(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					Jc(t, t.return), Cl(t);
					break;
				case 22:
					t.memoizedState === null && Cl(t);
					break;
				case 30:
					Cl(t);
					break;
				default: Cl(t);
			}
			e = e.sibling;
		}
	}
	function wl(e, t, n) {
		for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					wl(i, a, n), Uc(4, a);
					break;
				case 1:
					if (wl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ya(c[i], s);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					n && o & 64 && Gc(a), qc(a, a.return);
					break;
				case 27: tl(a);
				case 26:
				case 5:
					wl(i, a, n), n && r === null && o & 4 && Yc(a), qc(a, a.return);
					break;
				case 12:
					wl(i, a, n);
					break;
				case 31:
					wl(i, a, n), n && o & 4 && ml(i, a);
					break;
				case 13:
					wl(i, a, n), n && o & 4 && U(i, a);
					break;
				case 22:
					a.memoizedState === null && wl(i, a, n), qc(a, a.return);
					break;
				case 30: break;
				default: wl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Tl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && ca(n));
	}
	function El(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && ca(e));
	}
	function Dl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) Ol(e, t, n, r), t = t.sibling;
	}
	function Ol(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Dl(e, t, n, r), i & 2048 && Uc(9, t);
				break;
			case 1:
				Dl(e, t, n, r);
				break;
			case 3:
				Dl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && ca(e)));
				break;
			case 12:
				if (i & 2048) {
					Dl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else Dl(e, t, n, r);
				break;
			case 31:
				Dl(e, t, n, r);
				break;
			case 13:
				Dl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? Dl(e, t, n, r) : (a._visibility |= 2, kl(e, t, n, r, !!(t.subtreeFlags & 10256) || !1)) : a._visibility & 2 ? Dl(e, t, n, r) : Al(e, t), i & 2048 && Tl(o, t);
				break;
			case 24:
				Dl(e, t, n, r), i & 2048 && El(t.alternate, t);
				break;
			default: Dl(e, t, n, r);
		}
	}
	function kl(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					kl(a, o, s, c, i), Uc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, kl(a, o, s, c, i)) : u._visibility & 2 ? kl(a, o, s, c, i) : Al(a, o), i && l & 2048 && Tl(o.alternate, o);
					break;
				case 24:
					kl(a, o, s, c, i), i && l & 2048 && El(o.alternate, o);
					break;
				default: kl(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Al(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Al(n, r), i & 2048 && Tl(r.alternate, r);
					break;
				case 24:
					Al(n, r), i & 2048 && El(r.alternate, r);
					break;
				default: Al(n, r);
			}
			t = t.sibling;
		}
	}
	var jl = 8192;
	function Ml(e, t, n) {
		if (e.subtreeFlags & jl) for (e = e.child; e !== null;) Nl(e, t, n), e = e.sibling;
	}
	function Nl(e, t, n) {
		switch (e.tag) {
			case 26:
				Ml(e, t, n), e.flags & jl && e.memoizedState !== null && Gf(n, vl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				Ml(e, t, n);
				break;
			case 3:
			case 4:
				var r = vl;
				vl = gf(e.stateNode.containerInfo), Ml(e, t, n), vl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = jl, jl = 16777216, Ml(e, t, n), jl = r) : Ml(e, t, n));
				break;
			default: Ml(e, t, n);
		}
	}
	function Pl(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Fl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				ol = r, Rl(r, e);
			}
			Pl(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Il(e), e = e.sibling;
	}
	function Il(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Fl(e), e.flags & 2048 && Wc(9, e, e.return);
				break;
			case 3:
				Fl(e);
				break;
			case 12:
				Fl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Ll(e)) : Fl(e);
				break;
			default: Fl(e);
		}
	}
	function Ll(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				ol = r, Rl(r, e);
			}
			Pl(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Wc(8, t, t.return), Ll(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Ll(t));
					break;
				default: Ll(t);
			}
			e = e.sibling;
		}
	}
	function Rl(e, t) {
		for (; ol !== null;) {
			var n = ol;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Wc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: ca(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, ol = r;
			else a: for (n = e; ol !== null;) {
				r = ol;
				var i = r.sibling, a = r.return;
				if (ll(r), r === n) {
					ol = null;
					break a;
				}
				if (i !== null) {
					i.return = a, ol = i;
					break a;
				}
				ol = a;
			}
		}
	}
	var zl = {
		getCacheForType: function(e) {
			var t = ea(oa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return ea(oa).controller.signal;
		}
	}, Bl = typeof WeakMap == "function" ? WeakMap : Map, W = 0, G = null, K = null, q = 0, J = 0, Vl = null, Hl = !1, Ul = !1, Wl = !1, Gl = 0, Kl = 0, ql = 0, Jl = 0, Yl = 0, Xl = 0, Zl = 0, Ql = null, $l = null, eu = !1, tu = 0, nu = 0, ru = Infinity, iu = null, au = null, ou = 0, Y = null, X = null, su = 0, cu = 0, lu = null, uu = null, du = 0, fu = null;
	function pu() {
		return W & 2 && q !== 0 ? q & -q : k.T === null ? st() : dd();
	}
	function mu() {
		if (Xl === 0) {
			if (!(q & 536870912) || B) {
				var e = qe;
				qe <<= 1, !(qe & 3932160) && (qe = 262144), Xl = e;
			} else Xl = 536870912;
		}
		return e = no.current, e !== null && (e.flags |= 32), Xl;
	}
	function hu(e, t, n) {
		(e === G && (J === 2 || J === 9) || e.cancelPendingCommit !== null) && (Su(e, 0), yu(e, q, Xl, !1)), tt(e, n), (!(W & 2) || e !== G) && (e === G && (!(W & 2) && (Jl |= n), Kl === 4 && yu(e, q, Xl, !1)), rd(e));
	}
	function gu(e, t, n) {
		if (W & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || Ze(e, t), a = r ? Au(e, t) : Ou(e, t, !0), o = r;
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
					if (yu(r, t, Xl, !Hl), Xe(r, 0, !0) !== 0) break a;
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
				unsuspend: $t
			}, Nl(t, a, d);
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
					if (!z(a(), i)) return !1;
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
		n !== 0 && P(e, n, t);
	}
	function bu() {
		return W & 6 ? !0 : (id(0, !1), !1);
	}
	function xu() {
		if (K !== null) {
			if (J === 0) var e = K.return;
			else e = K, Ki = Gi = null, ko(e), ja = null, Ma = 0, e = K;
			for (; e !== null;) Hc(e.alternate, e), e = e.return;
			K = null;
		}
	}
	function Su(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), su = 0, xu(), G = e, K = n = li(e.current, null), q = t, J = 0, Vl = null, Hl = !1, Ul = Ze(e, t), Wl = !1, Zl = Xl = Yl = Jl = ql = Kl = 0, $l = Ql = null, eu = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - He(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Gl = t, $r(), n;
	}
	function Cu(e, t) {
		V = null, k.H = zs, t === xa || t === Ca ? (t = ka(), J = 3) : t === Sa ? (t = ka(), J = 4) : J = t === rc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Vl = t, K === null && (Kl = 1, Zs(e, _i(t, e.current)));
	}
	function wu() {
		var e = no.current;
		return e === null ? !0 : (q & 4194048) === q ? ro === null : (q & 62914560) === q || q & 536870912 ? e === ro : !1;
	}
	function Tu() {
		var e = k.H;
		return k.H = zs, e === null ? zs : e;
	}
	function Eu() {
		var e = k.A;
		return k.A = zl, e;
	}
	function Du() {
		Kl = 4, Hl || (q & 4194048) !== q && no.current !== null || (Ul = !0), !(ql & 134217727) && !(Jl & 134217727) || G === null || yu(G, q, Xl, !1);
	}
	function Ou(e, t, n) {
		var r = W;
		W |= 2;
		var i = Tu(), a = Eu();
		(G !== e || q !== t) && (iu = null, Su(e, t)), t = !1;
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
							no.current === null && (t = !0);
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
		return t && e.shellSuspendCounter++, Ki = Gi = null, W = r, k.H = i, k.A = a, K === null && (G = null, q = 0, $r()), o;
	}
	function ku() {
		for (; K !== null;) Mu(K);
	}
	function Au(e, t) {
		var n = W;
		W |= 2;
		var r = Tu(), a = Eu();
		G !== e || q !== t ? (iu = null, ru = Ae() + 500, Su(e, t)) : Ul = Ze(e, t);
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
							if (Ta(o)) {
								J = 0, Vl = null, Nu(t);
								break;
							}
							t = function() {
								J !== 2 && J !== 9 || G !== e || (J = 7), rd(e);
							}, o.then(t, t);
							break a;
						case 3:
							J = 7;
							break a;
						case 4:
							J = 5;
							break a;
						case 7:
							Ta(o) ? (J = 0, Vl = null, Nu(t)) : (J = 0, Vl = null, Pu(e, t, o, 7));
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
		return Ki = Gi = null, k.H = r, k.A = a, W = n, K === null ? (G = null, q = 0, $r(), Kl) : 0;
	}
	function ju() {
		for (; K !== null && !Oe();) Mu(K);
	}
	function Mu(e) {
		var t = Nc(e.alternate, e, Gl);
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : K = t;
	}
	function Nu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = _c(n, t, t.pendingProps, t.type, void 0, q);
				break;
			case 11:
				t = _c(n, t, t.pendingProps, t.type.render, t.ref, q);
				break;
			case 5: ko(t);
			default: Hc(n, t), t = K = ui(t, Gl), t = Nc(n, t, Gl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : K = t;
	}
	function Pu(e, t, n, r) {
		Ki = Gi = null, ko(t), ja = null, Ma = 0;
		var i = t.return;
		try {
			if (nc(e, i, t, n, q)) {
				Kl = 1, Zs(e, _i(n, e.current)), K = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw K = i, t;
			Kl = 1, Zs(e, _i(n, e.current)), K = null;
			return;
		}
		t.flags & 32768 ? (B || r === 1 ? e = !0 : Ul || q & 536870912 ? e = !1 : (Hl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = no.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Iu(t, e)) : Fu(t);
	}
	function Fu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Iu(t, Hl);
				return;
			}
			e = t.return;
			var n = Bc(t.alternate, t, Gl);
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
			var n = Vc(e.alternate, e);
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
		if (W & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= Qr, nt(e, n, o, s, c, l), e === G && (K = G = null, q = 0), X = t, Y = e, su = n, cu = o, lu = a, uu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Xu(Pe, function() {
				return Uu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = k.T, k.T = null, a = A.p, A.p = 2, s = W, W |= 4;
				try {
					sl(e, t, n);
				} finally {
					W = s, A.p = a, k.T = r;
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
				n = k.T, k.T = null;
				var r = A.p;
				A.p = 2;
				var i = W;
				W |= 4;
				try {
					yl(t, e);
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
					W = i, A.p = r, k.T = n;
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
				n = k.T, k.T = null;
				var r = A.p;
				A.p = 2;
				var i = W;
				W |= 4;
				try {
					cl(e, t.alternate, t);
				} finally {
					W = i, A.p = r, k.T = n;
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
			if (i === 0 && (au = null), ot(n), t = t.stateNode, Be && typeof Be.onCommitFiberRoot == "function") try {
				Be.onCommitFiberRoot(ze, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = k.T, i = A.p, A.p = 2, k.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					k.T = t, A.p = i;
				}
			}
			su & 3 && Hu(), rd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === fu ? du++ : (du = 0, fu = e) : du = 0, id(0, !1);
		}
	}
	function Vu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, ca(t)));
	}
	function Hu() {
		return Ru(), zu(), Bu(), Uu();
	}
	function Uu() {
		if (ou !== 5) return !1;
		var e = Y, t = cu;
		cu = 0;
		var n = ot(su), r = k.T, a = A.p;
		try {
			A.p = 32 > n ? 32 : n, k.T = null, n = lu, lu = null;
			var o = Y, s = su;
			if (ou = 0, X = Y = null, su = 0, W & 6) throw Error(i(331));
			var c = W;
			if (W |= 4, Il(o.current), Ol(o, o.current, s, n), W = c, id(0, !1), Be && typeof Be.onPostCommitFiberRoot == "function") try {
				Be.onPostCommitFiberRoot(ze, o);
			} catch {}
			return !0;
		} finally {
			A.p = a, k.T = r, Vu(e, t);
		}
	}
	function Wu(e, t, n) {
		t = _i(n, t), t = $s(e.stateNode, t, 2), e = Ua(e, t, 2), e !== null && (tt(e, 2), rd(e));
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
					e = _i(n, e), n = ec(2), r = Ua(t, n, 2), r !== null && (tc(n, r, t, e), tt(r, 2), rd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Bl();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Wl = !0, i.add(n), e = Ku.bind(null, e, t, n), t.then(e, e));
	}
	function Ku(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, G === e && (q & n) === n && (Kl === 4 || Kl === 3 && (q & 62914560) === q && 300 > Ae() - tu ? !(W & 2) && Su(e, 0) : Yl |= n, Zl === q && (Zl = 0)), rd(e);
	}
	function qu(e, t) {
		t === 0 && (t = $e()), e = ni(e, t), e !== null && (tt(e, t), rd(e));
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
						} else a = q, a = Xe(r, r === G ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Ze(r, a) || (n = !0, ld(r, a));
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
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Qe(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = G, n = q, n = Xe(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (J === 2 || J === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && De(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Ze(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && De(r), ot(n)) {
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
		return r = Xe(e, e === G ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (gu(e, r, t), sd(e, Ae()), e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null);
	}
	function ld(e, t) {
		if (Hu()) return null;
		gu(e, t, !0);
	}
	function ud() {
		Yd(function() {
			W & 6 ? Ee(Me, ad) : od();
		});
	}
	function dd() {
		if (nd === 0) {
			var e = da;
			e === 0 && (e = Ke, Ke <<= 1, !(Ke & 261888) && (Ke = 256)), nd = e;
		}
		return nd;
	}
	function fd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Qt("" + e);
	}
	function pd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function md(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = fd((i[dt] || null).action), o = r.submitter;
			o && (t = (t = o[dt] || null) ? fd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new xn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (nd !== 0) {
								var e = o ? pd(i, o) : new FormData(i);
								Ts(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? pd(i, o) : new FormData(i), Ts(n, {
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
	Jr(zr, "onAnimationEnd"), Jr(Br, "onAnimationIteration"), Jr(Vr, "onAnimationStart"), Jr("dblclick", "onDoubleClick"), Jr("focusin", "onFocus"), Jr("focusout", "onBlur"), Jr(Hr, "onTransitionRun"), Jr(Ur, "onTransitionStart"), Jr(Wr, "onTransitionCancel"), Jr(Gr, "onTransitionEnd"), Tt("onMouseEnter", ["mouseout", "mouseover"]), Tt("onMouseLeave", ["mouseout", "mouseover"]), Tt("onPointerEnter", ["pointerout", "pointerover"]), Tt("onPointerLeave", ["pointerout", "pointerover"]), wt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), wt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), wt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), wt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), wt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), wt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
		var n = t[pt];
		n === void 0 && (n = t[pt] = /* @__PURE__ */ new Set());
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
			e[xd] = !0, St.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !un || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (s = vt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		sn(function() {
			var r = a, i = tn(n), s = [];
			a: {
				var c = Kr.get(e);
				if (c !== void 0) {
					var l = xn, u = e;
					switch (e) {
						case "keypress": if (gn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = zn;
							break;
						case "focusin":
							u = "focus", l = An;
							break;
						case "focusout":
							u = "blur", l = An;
							break;
						case "beforeblur":
						case "afterblur":
							l = An;
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
							l = On;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = kn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Vn;
							break;
						case zr:
						case Br:
						case Vr:
							l = jn;
							break;
						case Gr:
							l = Hn;
							break;
						case "scroll":
						case "scrollend":
							l = Cn;
							break;
						case "wheel":
							l = Un;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Mn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Bn;
							break;
						case "toggle":
						case "beforetoggle": l = Wn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = cn(m, p), g != null && d.push(Td(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== en && (u = n.relatedTarget || n.fromElement) && (vt(u) || u[ft])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? vt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = On, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Bn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : bt(l), h = u == null ? c : bt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, vt(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
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
					if (c = r ? bt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = ur;
					else if (ir(c)) {
						if (dr) v = br;
						else {
							v = vr;
							var y = _r;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Yt(r.elementType) && (v = ur) : v = yr;
					if (v &&= v(e, r)) {
						ar(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Vt(c, "number", c.value);
				}
				switch (y = r ? bt(r) : window, e) {
					case "focusin":
						(ir(y) || y.contentEditable === "true") && (kr = y, Ar = r, jr = null);
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
				if (Kn) b: {
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
				else er ? Qn(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (Yn && n.locale !== "ko" && (er || x !== "onCompositionStart" ? x === "onCompositionEnd" && er && (b = hn()) : (fn = i, pn = "value" in fn ? fn.value : fn.textContent, er = !0)), y = Ed(r, x), 0 < y.length && (x = new Nn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = $n(n), b !== null && (x.data = b)))), (b = Jn ? tr(e, n) : nr(e, n)) && (x = Ed(r, "onBeforeInput"), 0 < x.length && (y = new Nn("onBeforeInput", "beforeinput", null, n, i), s.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = cn(e, n), i != null && r.unshift(Td(e, i, a)), i = cn(e, t), i != null && r.push(Td(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = cn(n, a), l != null && o.unshift(Td(n, l, c))) : i || (l = cn(n, a), l != null && o.push(Td(n, l, c)))), n = n.return;
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
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Gt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Gt(e, "" + r);
				break;
			case "className":
				jt(e, "class", r);
				break;
			case "tabIndex":
				jt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				jt(e, n, r);
				break;
			case "style":
				Jt(e, r, o);
				break;
			case "data": if (t !== "object") {
				jt(e, "data", r);
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
				r = Qt("" + r), e.setAttribute(n, r);
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
				r = Qt("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = $t);
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
				n = Qt("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				Q("beforetoggle", e), Q("toggle", e), At(e, "popover", r);
				break;
			case "xlinkActuate":
				Mt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Mt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Mt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Mt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Mt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Mt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Mt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Mt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Mt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				At(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Xt.get(n) || n, At(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Jt(e, r, o);
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
				typeof r == "string" ? Gt(e, r) : (typeof r == "number" || typeof r == "bigint") && Gt(e, "" + r);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = $t);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!Ct.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[dt] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : At(e, n, r);
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
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Ht(e, !!r, n, !0) : Ht(e, !!r, t, !1);
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
				Wt(e, r, a, o);
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
			default: if (Yt(t)) {
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
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Ht(e, !!n, n ? [] : "", !1) : Ht(e, !!n, t, !0)) : Ht(e, !!n, p, !1);
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
				Ut(e, p, m);
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
			default: if (Yt(t)) {
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
						a[gt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
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
					ef(n), _t(n);
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
			} else if (!e[gt]) switch (t) {
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
		_t(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = A.d;
	A.d = {
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
		var t = yt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Ds(t) : _f.r(e);
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
			var i = I(r).hoistableStyles, a = Af(e);
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
			var r = I(n).hoistableScripts, i = Pf(e), a = r.get(i);
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
			var r = I(n).hoistableScripts, i = Pf(e), a = r.get(i);
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
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = I(a).hoistableStyles, r = n.get(t), r || (r = {
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
					var o = I(a).hoistableStyles, s = o.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = I(a).hoistableScripts, r = n.get(t), r || (r = {
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
			if (!(a[gt] || a[ut] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
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
		_currentValue: se,
		_currentValue2: se,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = et(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = et(0), this.hiddenUpdates = et(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = si(3, null, null, t), e.current = a, a.stateNode = e, t = sa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Ba(a), e;
	}
	function tp(e) {
		return e ? (e = ai, e) : ai;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Ha(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ua(e, r, t), n !== null && (hu(n, e, t), Wa(n, e, t));
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
			t = at(t);
			var n = ni(e, t);
			n !== null && hu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = k.T;
		k.T = null;
		var a = A.p;
		try {
			A.p = 2, up(e, t, n, r);
		} finally {
			A.p = a, k.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = k.T;
		k.T = null;
		var a = A.p;
		try {
			A.p = 8, up(e, t, n, r);
		} finally {
			A.p = a, k.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) wd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = yt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Ye(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - He(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									rd(a), !(W & 6) && (ru = Ae() + 500, id(0, !1));
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
		return e = tn(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = vt(e), e !== null) {
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
		}, t !== null && (t = yt(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = vt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, ct(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, ct(e.priority, function() {
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
				en = r, n.target.dispatchEvent(r), en = null;
			} else return t = yt(n), t !== null && ap(t), e.blockedOn = n, !1;
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
				var a = yt(n);
				a !== null && (e.splice(t, 3), t -= 3, Ts(a, {
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
			var i = n[r], a = n[r + 1], o = i[dt] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[dt] || null) s = o.formAction;
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
			np(e.current, 2, null, e, null, null), bu(), t[ft] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = st();
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
	A.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.8",
		rendererPackageName: "react-dom",
		currentDispatcherRef: k,
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
		var n = !1, r = "", o = Js, s = Ys, c = Xs;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[ft] = t.current, Sd(e), new Fp(t);
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
})), _ = /* @__PURE__ */ c(u(), 1), v = g(), y = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){:root,:host{--shimmer-angle:20deg}*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-pan-x:initial;--tw-pan-y:initial;--tw-pinch-zoom:initial;--tw-space-y-reverse:0;--tw-space-x-reverse:0;--tw-divide-x-reverse:0;--tw-border-style:solid;--tw-divide-y-reverse:0;--tw-leading:initial;--tw-font-weight:initial;--tw-tracking:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-content:\"\";--tw-animation-delay:0s;--tw-animation-direction:normal;--tw-animation-duration:initial;--tw-animation-fill-mode:none;--tw-animation-iteration-count:1;--tw-enter-blur:0;--tw-enter-opacity:1;--tw-enter-rotate:0;--tw-enter-scale:1;--tw-enter-translate-x:0;--tw-enter-translate-y:0;--tw-exit-blur:0;--tw-exit-opacity:1;--tw-exit-rotate:0;--tw-exit-scale:1;--tw-exit-translate-x:0;--tw-exit-translate-y:0;--scroll-fade-t:0px;--scroll-fade-b:0px;--scroll-fade-s:0px;--scroll-fade-e:0px;--scroll-fade-mask:initial;--shimmer-image:initial;--shimmer-text-fill:initial}}}@layer theme{:root,:host{--font-sans:\"Geist Variable\", ui-sans-serif, system-ui, sans-serif;--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;--color-red-400:oklch(70.4% .191 22.216);--color-red-500:oklch(63.7% .237 25.331);--color-red-600:oklch(57.7% .245 27.325);--color-black:#000;--spacing:.25rem;--container-xs:20rem;--container-sm:24rem;--container-lg:32rem;--container-xl:36rem;--container-5xl:64rem;--container-6xl:72rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height:calc(1.5 / 1);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--text-3xl:1.875rem;--text-3xl--line-height:calc(2.25 / 1.875);--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--tracking-tight:-.025em;--tracking-widest:.1em;--leading-snug:1.375;--leading-normal:1.5;--radius-md:calc(var(--radius) - 2px);--ease-in:cubic-bezier(.4, 0, 1, 1);--ease-out:cubic-bezier(0, 0, .2, 1);--ease-in-out:cubic-bezier(.4, 0, .2, 1);--animate-spin:spin 1s linear infinite;--blur-xs:4px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:\"Geist Variable\", ui-sans-serif, system-ui, sans-serif;--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", \"Noto Sans\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring:where(:not(iframe)){outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab, red, red)){::placeholder{color:color-mix(in oklab, currentcolor 50%, transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}*{border-color:var(--border);outline-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){*{outline-color:color-mix(in oklab, var(--ring) 50%, transparent)}}body{background-color:var(--background);color:var(--foreground)}html{font-family:Geist Variable,ui-sans-serif,system-ui,sans-serif}}@layer components;@layer utilities{.\\@container\\/card-header{container:card-header/inline-size}.\\@container{container-type:inline-size}.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.invisible{visibility:hidden}.visible{visibility:visible}.sr-only{clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.not-sr-only{clip-path:none;white-space:normal;width:auto;height:auto;margin:0;padding:0;position:static;overflow:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.inset-0{inset:0}.top-1{top:var(--spacing)}.top-1\\/2{top:50%}.top-1\\/3{top:33.3333%}.top-2{top:calc(var(--spacing) * 2)}.top-6{top:calc(var(--spacing) * 6)}.right-2{right:calc(var(--spacing) * 2)}.right-6{right:calc(var(--spacing) * 6)}.left-1{left:var(--spacing)}.left-1\\/2{left:50%}.isolate{isolation:isolate}.isolation-auto{isolation:auto}.z-10{z-index:10}.z-40{z-index:40}.z-50{z-index:50}.order-first{order:-9999}.order-last{order:9999}.col-start-2{grid-column-start:2}.row-span-2{grid-row:span 2/span 2}.row-start-1{grid-row-start:1}.container{width:100%}@media (width>=40rem){.container{max-width:40rem}}@media (width>=48rem){.container{max-width:48rem}}@media (width>=64rem){.container{max-width:64rem}}@media (width>=80rem){.container{max-width:80rem}}@media (width>=96rem){.container{max-width:96rem}}.m-0{margin:0}.-mx-1{margin-inline:calc(var(--spacing) * -1)}.-mx-4{margin-inline:calc(var(--spacing) * -4)}.mx-1{margin-inline:var(--spacing)}.mx-2{margin-inline:calc(var(--spacing) * 2)}.mx-auto{margin-inline:auto}.my-1{margin-block:var(--spacing)}.my-2{margin-block:calc(var(--spacing) * 2)}.mt-1{margin-top:var(--spacing)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-2{margin-top:calc(var(--spacing) * 2)}.-mb-4{margin-bottom:calc(var(--spacing) * -4)}.mb-1{margin-bottom:var(--spacing)}.mb-1\\.5{margin-bottom:calc(var(--spacing) * 1.5)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.ml-2{margin-left:calc(var(--spacing) * 2)}.ml-auto{margin-left:auto}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.line-clamp-1{-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.line-clamp-2{-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.block{display:block}.contents{display:contents}.flex{display:flex}.flow-root{display:flow-root}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.inline-grid{display:inline-grid}.inline-table{display:inline-table}.list-item{display:list-item}.table{display:table}.table-caption{display:table-caption}.table-cell{display:table-cell}.table-column{display:table-column}.table-column-group{display:table-column-group}.table-footer-group{display:table-footer-group}.table-header-group{display:table-header-group}.table-row{display:table-row}.table-row-group{display:table-row-group}.field-sizing-content{field-sizing:content}.size-4{width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.size-6{width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.size-7{width:calc(var(--spacing) * 7);height:calc(var(--spacing) * 7)}.size-8{width:calc(var(--spacing) * 8);height:calc(var(--spacing) * 8)}.size-9{width:calc(var(--spacing) * 9);height:calc(var(--spacing) * 9)}.size-10{width:calc(var(--spacing) * 10);height:calc(var(--spacing) * 10)}.size-full{width:100%;height:100%}.h-0{height:0}.h-1{height:var(--spacing)}.h-6{height:calc(var(--spacing) * 6)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-8\\!{height:calc(var(--spacing) * 8)!important}.h-9{height:calc(var(--spacing) * 9)}.h-auto{height:auto}.h-full{height:100%}.h-px{height:1px}.max-h-\\(--radix-select-content-available-height\\){max-height:var(--radix-select-content-available-height)}.max-h-72{max-height:calc(var(--spacing) * 72)}.max-h-80{max-height:calc(var(--spacing) * 80)}.min-h-0{min-height:0}.min-h-16{min-height:calc(var(--spacing) * 16)}.min-h-32{min-height:calc(var(--spacing) * 32)}.min-h-svh{min-height:100svh}.w-0{width:0}.w-80{width:calc(var(--spacing) * 80)}.w-\\[35\\%\\]{width:35%}.w-fit{width:fit-content}.w-full{width:100%}.max-w-5xl{max-width:var(--container-5xl)}.max-w-6xl{max-width:var(--container-6xl)}.max-w-\\[calc\\(100\\%-2rem\\)\\]{max-width:calc(100% - 2rem)}.max-w-lg{max-width:var(--container-lg)}.max-w-xl{max-width:var(--container-xl)}.min-w-0{min-width:0}.min-w-36{min-width:calc(var(--spacing) * 36)}.flex-1{flex:1}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.grow{flex-grow:1}.basis-full{flex-basis:100%}.border-collapse{border-collapse:collapse}.origin-\\(--radix-select-content-transform-origin\\){transform-origin:var(--radix-select-content-transform-origin)}.-translate-x-1{--tw-translate-x:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-x-1\\/2{--tw-translate-x:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1{--tw-translate-y:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-y-0{--tw-translate-y:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-none{translate:none}.scale-3d{scale:var(--tw-scale-x) var(--tw-scale-y) var(--tw-scale-z)}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.shimmer{--_spread:var(--shimmer-spread,calc(3ch + 40px));--_base:currentColor;--_highlight:var(--shimmer-color,oklch(from currentColor l c h / calc(alpha* .2)));background-image:var(--shimmer-image,linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), var(--_highlight) calc(50% - var(--_spread) * .5), var(--_highlight) 50%, var(--_highlight) calc(50% + var(--_spread) * .5), var(--_base) calc(50% + var(--_spread))))}@supports (color:color-mix(in lab, red, red)){.shimmer{background-image:var(--shimmer-image,linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% - var(--_spread) * .5), var(--_highlight) 50%, color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% + var(--_spread) * .5), var(--_base) calc(50% + var(--_spread))))}}.shimmer{background-repeat:no-repeat;background-size:calc(200% + var(--_spread) * 2) 100%;-webkit-text-fill-color:var(--shimmer-text-fill,transparent);animation:tw-shimmer var(--shimmer-duration,2s) linear infinite;background-position:0 0;-webkit-background-clip:text;background-clip:text}.shimmer:is(.dark *){--_highlight:var(--shimmer-color,oklch(from currentColor max(.8, calc(l + .4)) c h / calc(alpha + .4)))}.shimmer:where([dir=rtl],[dir=rtl] *){animation-direction:reverse}.scroll-fade{--_scroll-fade-size-t:var(--scroll-fade-t-size,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));--_scroll-fade-size-b:var(--scroll-fade-b-size,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));--scroll-fade-block:linear-gradient(to bottom, transparent 0, #000 var(--scroll-fade-t,0px), #000 calc(100% - var(--scroll-fade-b,0px)), transparent 100%);-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-composite:source-in;mask-composite:intersect}@supports (animation-timeline:scroll()){.scroll-fade{animation:1ms ease-in-out scroll-fade-reveal-t,1ms ease-in-out scroll-fade-reveal-b;animation-timeline:scroll(self y),scroll(self y);animation-range:0 var(--scroll-fade-reveal,calc(var(--spacing) * 24)), calc(100% - var(--scroll-fade-reveal,calc(var(--spacing) * 24))) 100%;animation-fill-mode:both}}@supports not (animation-timeline:scroll()){.scroll-fade{--scroll-fade-t:var(--_scroll-fade-size-t);--scroll-fade-b:var(--_scroll-fade-size-b)}}.animate-spin{animation:var(--animate-spin)}.animate-surface-in{animation:.16s cubic-bezier(.16,1,.3,1) s4e-surface-in}.cursor-default{cursor:default}.cursor-text{cursor:text}.touch-pinch-zoom{--tw-pinch-zoom:pinch-zoom;touch-action:var(--tw-pan-x,) var(--tw-pan-y,) var(--tw-pinch-zoom,)}.resize{resize:both}.resize-none{resize:none}.scroll-my-1{scroll-margin-block:var(--spacing)}.scroll-py-1{scroll-padding-block:var(--spacing)}.auto-rows-min{grid-auto-rows:min-content}.grid-rows-\\[auto_1fr\\]{grid-template-rows:auto 1fr}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.flex-wrap{flex-wrap:wrap}.place-items-center{place-items:center}.items-center{align-items:center}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-start{justify-content:flex-start}.gap-\\(--card-spacing\\){gap:var(--card-spacing)}.gap-0{gap:0}.gap-0\\.5{gap:calc(var(--spacing) * .5)}.gap-1{gap:var(--spacing)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-2\\.5{gap:calc(var(--spacing) * 2.5)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-6{gap:calc(var(--spacing) * 6)}:where(.space-y-reverse>:not(:last-child)){--tw-space-y-reverse:1}:where(.space-x-reverse>:not(:last-child)){--tw-space-x-reverse:1}:where(.divide-x>:not(:last-child)){--tw-divide-x-reverse:0;border-inline-style:var(--tw-border-style);border-inline-start-width:calc(1px * var(--tw-divide-x-reverse));border-inline-end-width:calc(1px * calc(1 - var(--tw-divide-x-reverse)))}:where(.divide-y>:not(:last-child)){--tw-divide-y-reverse:0;border-bottom-style:var(--tw-border-style);border-top-style:var(--tw-border-style);border-top-width:calc(1px * var(--tw-divide-y-reverse));border-bottom-width:calc(1px * calc(1 - var(--tw-divide-y-reverse)))}:where(.divide-y-reverse>:not(:last-child)){--tw-divide-y-reverse:1}.self-start{align-self:flex-start}.justify-self-end{justify-self:flex-end}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-x-hidden{overflow-x:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-\\[calc\\(var\\(--radius\\)-3px\\)\\]{border-radius:calc(var(--radius) - 3px)}.rounded-\\[min\\(var\\(--radius-md\\)\\,10px\\)\\]{border-radius:min(var(--radius-md), 10px)}.rounded-\\[min\\(var\\(--radius-md\\)\\,12px\\)\\]{border-radius:min(var(--radius-md), 12px)}.rounded-full{border-radius:2147483647px}.rounded-lg{border-radius:var(--radius)}.rounded-lg\\!{border-radius:var(--radius)!important}.rounded-md{border-radius:calc(var(--radius) - 2px)}.rounded-none{border-radius:0}.rounded-sm{border-radius:calc(var(--radius) - 4px)}.rounded-xl{border-radius:calc(var(--radius) + 4px)}.rounded-xl\\!{border-radius:calc(var(--radius) + 4px)!important}.rounded-s{border-start-start-radius:.25rem;border-end-start-radius:.25rem}.rounded-ss{border-start-start-radius:.25rem}.rounded-e{border-start-end-radius:.25rem;border-end-end-radius:.25rem}.rounded-se{border-start-end-radius:.25rem}.rounded-ee{border-end-end-radius:.25rem}.rounded-es{border-end-start-radius:.25rem}.rounded-t{border-top-left-radius:.25rem;border-top-right-radius:.25rem}.rounded-t-xl{border-top-left-radius:calc(var(--radius) + 4px);border-top-right-radius:calc(var(--radius) + 4px)}.rounded-l{border-top-left-radius:.25rem;border-bottom-left-radius:.25rem}.rounded-l-none{border-top-left-radius:0;border-bottom-left-radius:0}.rounded-tl{border-top-left-radius:.25rem}.rounded-r{border-top-right-radius:.25rem;border-bottom-right-radius:.25rem}.rounded-r-none{border-top-right-radius:0;border-bottom-right-radius:0}.rounded-tr{border-top-right-radius:.25rem}.rounded-b{border-bottom-right-radius:.25rem;border-bottom-left-radius:.25rem}.rounded-b-xl{border-bottom-right-radius:calc(var(--radius) + 4px);border-bottom-left-radius:calc(var(--radius) + 4px)}.rounded-br{border-bottom-right-radius:.25rem}.rounded-bl{border-bottom-left-radius:.25rem}.border{border-style:var(--tw-border-style);border-width:1px}.border-0{border-style:var(--tw-border-style);border-width:0}.border-x{border-inline-style:var(--tw-border-style);border-inline-width:1px}.border-y{border-block-style:var(--tw-border-style);border-block-width:1px}.border-s{border-inline-start-style:var(--tw-border-style);border-inline-start-width:1px}.border-e{border-inline-end-style:var(--tw-border-style);border-inline-end-width:1px}.border-bs{border-block-start-style:var(--tw-border-style);border-block-start-width:1px}.border-be{border-block-end-style:var(--tw-border-style);border-block-end-width:1px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-r{border-right-style:var(--tw-border-style);border-right-width:1px}.border-b{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-l{border-left-style:var(--tw-border-style);border-left-width:1px}.border-l-0{border-left-style:var(--tw-border-style);border-left-width:0}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-border{border-color:var(--border)}.border-input,.border-input\\/30{border-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.border-input\\/30{border-color:color-mix(in oklab, var(--input) 30%, transparent)}}.border-red-500{border-color:var(--color-red-500)}.border-transparent{border-color:#0000}.bg-background{background-color:var(--background)}.bg-black{background-color:var(--color-black)}.bg-black\\/10{background-color:#0000001a}@supports (color:color-mix(in lab, red, red)){.bg-black\\/10{background-color:color-mix(in oklab, var(--color-black) 10%, transparent)}}.bg-border{background-color:var(--border)}.bg-card{background-color:var(--card)}.bg-destructive,.bg-destructive\\/10{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.bg-destructive\\/10{background-color:color-mix(in oklab, var(--destructive) 10%, transparent)}}.bg-foreground{background-color:var(--foreground)}.bg-input,.bg-input\\/30{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.bg-input\\/30{background-color:color-mix(in oklab, var(--input) 30%, transparent)}}.bg-muted,.bg-muted\\/50{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.bg-muted\\/50{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}.bg-popover{background-color:var(--popover)}.bg-primary{background-color:var(--primary)}.bg-secondary{background-color:var(--secondary)}.bg-transparent{background-color:#0000}.bg-clip-padding{background-clip:padding-box}.bg-repeat{background-repeat:repeat}.mask-no-clip{-webkit-mask-clip:no-clip;mask-clip:no-clip}.mask-repeat{-webkit-mask-repeat:repeat;mask-repeat:repeat}.p-\\(--card-spacing\\){padding:var(--card-spacing)}.p-0{padding:0}.p-1{padding:var(--spacing)}.p-2{padding:calc(var(--spacing) * 2)}.p-3{padding:calc(var(--spacing) * 3)}.p-4{padding:calc(var(--spacing) * 4)}.px-\\(--card-spacing\\){padding-inline:var(--card-spacing)}.px-0{padding-inline:0}.px-1{padding-inline:var(--spacing)}.px-1\\.5{padding-inline:calc(var(--spacing) * 1.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-6{padding-inline:calc(var(--spacing) * 6)}.px-8{padding-inline:calc(var(--spacing) * 8)}.py-\\(--card-spacing\\){padding-block:var(--card-spacing)}.py-1{padding-block:var(--spacing)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-2\\.5{padding-block:calc(var(--spacing) * 2.5)}.py-3{padding-block:calc(var(--spacing) * 3)}.py-5{padding-block:calc(var(--spacing) * 5)}.py-6{padding-block:calc(var(--spacing) * 6)}.py-10{padding-block:calc(var(--spacing) * 10)}.py-12{padding-block:calc(var(--spacing) * 12)}.pt-2{padding-top:calc(var(--spacing) * 2)}.pr-2{padding-right:calc(var(--spacing) * 2)}.pr-8{padding-right:calc(var(--spacing) * 8)}.pb-0{padding-bottom:0}.pb-1{padding-bottom:var(--spacing)}.pb-2{padding-bottom:calc(var(--spacing) * 2)}.pb-2\\.5{padding-bottom:calc(var(--spacing) * 2.5)}.pb-3{padding-bottom:calc(var(--spacing) * 3)}.pb-6{padding-bottom:calc(var(--spacing) * 6)}.pl-1{padding-left:var(--spacing)}.pl-1\\.5{padding-left:calc(var(--spacing) * 1.5)}.pl-2{padding-left:calc(var(--spacing) * 2)}.pl-2\\.5{padding-left:calc(var(--spacing) * 2.5)}.text-center{text-align:center}.text-left{text-align:left}.font-heading{font-family:var(--font-sans)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[0\\.8rem\\]{font-size:.8rem}.leading-none{--tw-leading:1;line-height:1}.leading-normal{--tw-leading:var(--leading-normal);line-height:var(--leading-normal)}.leading-snug{--tw-leading:var(--leading-snug);line-height:var(--leading-snug)}.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-normal{--tw-font-weight:var(--font-weight-normal);font-weight:var(--font-weight-normal)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.tracking-widest{--tw-tracking:var(--tracking-widest);letter-spacing:var(--tracking-widest)}.text-balance{text-wrap:balance}.text-wrap{text-wrap:wrap}.break-all{word-break:break-all}.text-clip{text-overflow:clip}.text-ellipsis{text-overflow:ellipsis}.whitespace-nowrap{white-space:nowrap}.text-background{color:var(--background)}.text-card-foreground{color:var(--card-foreground)}.text-destructive{color:var(--destructive)}.text-foreground{color:var(--foreground)}.text-muted-foreground,.text-muted-foreground\\/50{color:var(--muted-foreground)}@supports (color:color-mix(in lab, red, red)){.text-muted-foreground\\/50{color:color-mix(in oklab, var(--muted-foreground) 50%, transparent)}}.text-popover-foreground{color:var(--popover-foreground)}.text-primary{color:var(--primary)}.text-primary-foreground{color:var(--primary-foreground)}.text-red-600{color:var(--color-red-600)}.text-secondary-foreground{color:var(--secondary-foreground)}.capitalize{text-transform:capitalize}.lowercase{text-transform:lowercase}.normal-case{text-transform:none}.uppercase{text-transform:uppercase}.italic{font-style:italic}.not-italic{font-style:normal}.diagonal-fractions{--tw-numeric-fraction:diagonal-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.lining-nums{--tw-numeric-figure:lining-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.oldstyle-nums{--tw-numeric-figure:oldstyle-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.ordinal{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.proportional-nums{--tw-numeric-spacing:proportional-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.slashed-zero{--tw-slashed-zero:slashed-zero;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.stacked-fractions{--tw-numeric-fraction:stacked-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.tabular-nums{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.normal-nums{font-variant-numeric:normal}.line-through{text-decoration-line:line-through}.no-underline{text-decoration-line:none}.overline{text-decoration-line:overline}.underline{text-decoration-line:underline}.underline-offset-4{text-underline-offset:4px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.subpixel-antialiased{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}.opacity-0{opacity:0}.opacity-50{opacity:.5}.opacity-60{opacity:.6}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px var(--tw-shadow-color,#0000001a), 0 2px 4px -2px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-none{--tw-shadow:0 0 #0000;box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-none\\!{--tw-shadow:0 0 #0000!important;box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)!important}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-0{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-1{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.inset-ring{--tw-inset-ring-shadow:inset 0 0 0 1px var(--tw-inset-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-foreground,.ring-foreground\\/10{--tw-ring-color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.ring-foreground\\/10{--tw-ring-color:color-mix(in oklab, var(--foreground) 10%, transparent)}}.outline-hidden{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.outline-hidden{outline-offset:2px;outline:2px solid #0000}}.outline{outline-style:var(--tw-outline-style);outline-width:1px}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.drop-shadow{--tw-drop-shadow-size:drop-shadow(0 1px 2px var(--tw-drop-shadow-color,#0000001a)) drop-shadow(0 1px 1px var(--tw-drop-shadow-color,#0000000f));--tw-drop-shadow:drop-shadow(0 1px 2px #0000001a) drop-shadow(0 1px 1px #0000000f);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.grayscale{--tw-grayscale:grayscale(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.sepia{--tw-sepia:sepia(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur{--tw-backdrop-blur:blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-grayscale{--tw-backdrop-grayscale:grayscale(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-invert{--tw-backdrop-invert:invert(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-sepia{--tw-backdrop-sepia:sepia(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-100{--tw-duration:.1s;transition-duration:.1s}.ease-in{--tw-ease:var(--ease-in);transition-timing-function:var(--ease-in)}.ease-in-out{--tw-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.outline-none{--tw-outline-style:none;outline-style:none}.select-none{-webkit-user-select:none;user-select:none}.\\[--card-spacing\\:--spacing\\(4\\)\\]{--card-spacing:calc(var(--spacing) * 4)}:where(.divide-x-reverse>:not(:last-child)){--tw-divide-x-reverse:1}.paused{animation-play-state:paused}.ring-inset{--tw-ring-inset:inset}.running{animation-play-state:running}.zoom-in{--tw-enter-scale:0}.zoom-out{--tw-exit-scale:0}.group-has-data-\\[slot\\=command-shortcut\\]\\/command-item\\:hidden:is(:where(.group\\/command-item):has([data-slot=command-shortcut]) *){display:none}.group-has-data-\\[slot\\=item-description\\]\\/item\\:translate-y-0\\.5:is(:where(.group\\/item):has([data-slot=item-description]) *){--tw-translate-y:calc(var(--spacing) * .5);translate:var(--tw-translate-x) var(--tw-translate-y)}.group-has-data-\\[slot\\=item-description\\]\\/item\\:self-start:is(:where(.group\\/item):has([data-slot=item-description]) *){align-self:flex-start}.group-has-\\[\\>input\\]\\/input-group\\:pt-2:is(:where(.group\\/input-group):has(>input) *){padding-top:calc(var(--spacing) * 2)}.group-has-\\[\\>input\\]\\/input-group\\:pb-2:is(:where(.group\\/input-group):has(>input) *){padding-bottom:calc(var(--spacing) * 2)}.group-has-\\[\\>svg\\]\\/alert\\:col-start-2:is(:where(.group\\/alert):has(>svg) *){grid-column-start:2}.group-data-\\[checked\\=true\\]\\/command-item\\:opacity-100:is(:where(.group\\/command-item)[data-checked=true] *){opacity:1}.group-data-\\[disabled\\=true\\]\\:pointer-events-none:is(:where(.group)[data-disabled=true] *){pointer-events:none}.group-data-\\[disabled\\=true\\]\\:opacity-50:is(:where(.group)[data-disabled=true] *),.group-data-\\[disabled\\=true\\]\\/input-group\\:opacity-50:is(:where(.group\\/input-group)[data-disabled=true] *){opacity:.5}.group-data-\\[size\\=default\\]\\/switch\\:size-4:is(:where(.group\\/switch)[data-size=default] *){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.group-data-\\[size\\=sm\\]\\/alert-dialog-content\\:grid:is(:where(.group\\/alert-dialog-content)[data-size=sm] *){display:grid}.group-data-\\[size\\=sm\\]\\/alert-dialog-content\\:grid-cols-2:is(:where(.group\\/alert-dialog-content)[data-size=sm] *){grid-template-columns:repeat(2,minmax(0,1fr))}.group-data-\\[size\\=sm\\]\\/card\\:text-sm:is(:where(.group\\/card)[data-size=sm] *){font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.group-data-\\[size\\=sm\\]\\/item\\:size-8:is(:where(.group\\/item)[data-size=sm] *){width:calc(var(--spacing) * 8);height:calc(var(--spacing) * 8)}.group-data-\\[size\\=sm\\]\\/switch\\:size-3:is(:where(.group\\/switch)[data-size=sm] *){width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.group-data-\\[size\\=xs\\]\\/item\\:size-6:is(:where(.group\\/item)[data-size=xs] *){width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.group-data-\\[size\\=xs\\]\\/item\\:gap-0:is(:where(.group\\/item)[data-size=xs] *){gap:0}.group-data-\\[size\\=xs\\]\\/item\\:text-xs:is(:where(.group\\/item)[data-size=xs] *){font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.group-data-selected\\/command-item\\:text-foreground:is(:where(.group\\/command-item):where([data-selected=true]) *){color:var(--foreground)}.peer-disabled\\:cursor-not-allowed:is(:where(.peer):disabled~*){cursor:not-allowed}.peer-disabled\\:opacity-50:is(:where(.peer):disabled~*){opacity:.5}.file\\:inline-flex::file-selector-button{display:inline-flex}.file\\:h-6::file-selector-button{height:calc(var(--spacing) * 6)}.file\\:border-0::file-selector-button{border-style:var(--tw-border-style);border-width:0}.file\\:bg-transparent::file-selector-button{background-color:#0000}.file\\:text-sm::file-selector-button{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.file\\:font-medium::file-selector-button{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.file\\:text-foreground::file-selector-button{color:var(--foreground)}.placeholder\\:text-muted-foreground::placeholder{color:var(--muted-foreground)}.after\\:absolute:after{content:var(--tw-content);position:absolute}.after\\:-inset-x-3:after{content:var(--tw-content);inset-inline:calc(var(--spacing) * -3)}.after\\:-inset-y-2:after{content:var(--tw-content);inset-block:calc(var(--spacing) * -2)}@media (hover:hover){.hover\\:bg-\\[color-mix\\(in_oklch\\,var\\(--secondary\\)\\,var\\(--foreground\\)_5\\%\\)\\]:hover{background-color:var(--secondary)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-\\[color-mix\\(in_oklch\\,var\\(--secondary\\)\\,var\\(--foreground\\)_5\\%\\)\\]:hover{background-color:color-mix(in oklch,var(--secondary),var(--foreground) 5%)}}.hover\\:bg-destructive\\/20:hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-destructive\\/20:hover{background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.hover\\:bg-muted:hover{background-color:var(--muted)}.hover\\:bg-primary\\/80:hover{background-color:var(--primary)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-primary\\/80:hover{background-color:color-mix(in oklab, var(--primary) 80%, transparent)}}.hover\\:text-foreground:hover{color:var(--foreground)}.hover\\:underline:hover{text-decoration-line:underline}}.focus\\:bg-accent:focus{background-color:var(--accent)}.focus\\:text-accent-foreground:focus,:is(.not-data-\\[variant\\=destructive\\]\\:focus\\:\\*\\*\\:text-accent-foreground:not([data-variant=destructive]):focus *){color:var(--accent-foreground)}.focus-visible\\:border-destructive\\/40:focus-visible{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:border-destructive\\/40:focus-visible{border-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.focus-visible\\:border-ring:focus-visible{border-color:var(--ring)}.focus-visible\\:ring-0:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-3:focus-visible,.focus-visible\\:ring-\\[3px\\]:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-destructive\\/20:focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-destructive\\/20:focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.focus-visible\\:ring-ring\\/50:focus-visible{--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-ring\\/50:focus-visible{--tw-ring-color:color-mix(in oklab, var(--ring) 50%, transparent)}}.active\\:not-aria-\\[haspopup\\]\\:translate-y-0:active:not([aria-haspopup]){--tw-translate-y:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.active\\:not-aria-\\[haspopup\\]\\:translate-y-px:active:not([aria-haspopup]){--tw-translate-y:1px;translate:var(--tw-translate-x) var(--tw-translate-y)}.disabled\\:pointer-events-none:disabled{pointer-events:none}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:bg-input\\/50:disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.disabled\\:bg-input\\/50:disabled{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.disabled\\:bg-transparent:disabled{background-color:#0000}.disabled\\:opacity-50:disabled{opacity:.5}:where([data-slot=button-group]) .in-data-\\[slot\\=button-group\\]\\:rounded-lg{border-radius:var(--radius)}:where([data-slot=combobox-content]) .in-data-\\[slot\\=combobox-content\\]\\:focus-within\\:border-inherit:focus-within{border-color:inherit}:where([data-slot=combobox-content]) .in-data-\\[slot\\=combobox-content\\]\\:focus-within\\:ring-0:focus-within{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}:where([data-slot=dialog-content]) .in-data-\\[slot\\=dialog-content\\]\\:rounded-lg\\!{border-radius:var(--radius)!important}:where([data-slot=dropdown-menu-content]) .in-data-\\[slot\\=dropdown-menu-content\\]\\:p-0{padding:0}.has-disabled\\:bg-input\\/50:has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.has-disabled\\:bg-input\\/50:has(:disabled){background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.has-disabled\\:opacity-50:has(:disabled){opacity:.5}.has-data-\\[icon\\=inline-end\\]\\:pr-1\\.5:has([data-icon=inline-end]){padding-right:calc(var(--spacing) * 1.5)}.has-data-\\[icon\\=inline-end\\]\\:pr-2:has([data-icon=inline-end]){padding-right:calc(var(--spacing) * 2)}.has-data-\\[icon\\=inline-start\\]\\:pl-1\\.5:has([data-icon=inline-start]){padding-left:calc(var(--spacing) * 1.5)}.has-data-\\[icon\\=inline-start\\]\\:pl-2:has([data-icon=inline-start]){padding-left:calc(var(--spacing) * 2)}.has-data-\\[size\\=sm\\]\\:gap-2\\.5:has([data-size=sm]){gap:calc(var(--spacing) * 2.5)}.has-data-\\[size\\=xs\\]\\:gap-2:has([data-size=xs]){gap:calc(var(--spacing) * 2)}.has-data-\\[slot\\=alert-action\\]\\:relative:has([data-slot=alert-action]){position:relative}.has-data-\\[slot\\=alert-action\\]\\:pr-18:has([data-slot=alert-action]){padding-right:calc(var(--spacing) * 18)}.has-data-\\[slot\\=alert-dialog-media\\]\\:grid-rows-\\[auto_auto_1fr\\]:has([data-slot=alert-dialog-media]){grid-template-rows:auto auto 1fr}.has-data-\\[slot\\=alert-dialog-media\\]\\:gap-x-4:has([data-slot=alert-dialog-media]){column-gap:calc(var(--spacing) * 4)}.has-data-\\[slot\\=card-action\\]\\:grid-cols-\\[1fr_auto\\]:has([data-slot=card-action]){grid-template-columns:1fr auto}.has-data-\\[slot\\=card-description\\]\\:grid-rows-\\[auto_auto\\]:has([data-slot=card-description]){grid-template-rows:auto auto}.has-data-\\[slot\\=card-footer\\]\\:pb-0:has([data-slot=card-footer]){padding-bottom:0}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:border-ring:has([data-slot=input-group-control]:focus-visible){border-color:var(--ring)}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-3:has([data-slot=input-group-control]:focus-visible){--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-ring\\/50:has([data-slot=input-group-control]:focus-visible){--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-ring\\/50:has([data-slot=input-group-control]:focus-visible){--tw-ring-color:color-mix(in oklab, var(--ring) 50%, transparent)}}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:border-destructive:has([data-slot][aria-invalid=true]){border-color:var(--destructive)}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-3:has([data-slot][aria-invalid=true]){--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/20:has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/20:has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:h-auto:has(>[data-align=block-end]){height:auto}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:flex-col:has(>[data-align=block-end]){flex-direction:column}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:h-auto:has(>[data-align=block-start]){height:auto}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:flex-col:has(>[data-align=block-start]){flex-direction:column}.has-\\[\\>button\\]\\:mr-\\[-0\\.3rem\\]:has(>button){margin-right:-.3rem}.has-\\[\\>button\\]\\:ml-\\[-0\\.3rem\\]:has(>button){margin-left:-.3rem}.has-\\[\\>img\\:first-child\\]\\:pt-0:has(>img:first-child){padding-top:0}.has-\\[\\>kbd\\]\\:mr-\\[-0\\.15rem\\]:has(>kbd){margin-right:-.15rem}.has-\\[\\>kbd\\]\\:ml-\\[-0\\.15rem\\]:has(>kbd){margin-left:-.15rem}.has-\\[\\>svg\\]\\:grid-cols-\\[auto_1fr\\]:has(>svg){grid-template-columns:auto 1fr}.has-\\[\\>svg\\]\\:gap-x-2:has(>svg){column-gap:calc(var(--spacing) * 2)}.has-\\[\\>svg\\]\\:p-0:has(>svg){padding:0}.has-\\[\\>textarea\\]\\:h-auto:has(>textarea){height:auto}.aria-expanded\\:bg-muted[aria-expanded=true]{background-color:var(--muted)}.aria-expanded\\:bg-secondary[aria-expanded=true]{background-color:var(--secondary)}.aria-expanded\\:text-foreground[aria-expanded=true]{color:var(--foreground)}.aria-expanded\\:text-secondary-foreground[aria-expanded=true]{color:var(--secondary-foreground)}.aria-invalid\\:border-destructive[aria-invalid=true]{border-color:var(--destructive)}.aria-invalid\\:ring-0[aria-invalid=true]{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.aria-invalid\\:ring-3[aria-invalid=true]{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.aria-invalid\\:ring-destructive\\/20[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.aria-invalid\\:ring-destructive\\/20[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.data-placeholder\\:text-muted-foreground[data-placeholder]{color:var(--muted-foreground)}.data-\\[align-trigger\\=true\\]\\:animate-none[data-align-trigger=true]{animation:none}.data-\\[disabled\\=true\\]\\:pointer-events-none[data-disabled=true]{pointer-events:none}.data-\\[disabled\\=true\\]\\:opacity-50[data-disabled=true]{opacity:.5}.data-\\[position\\=popper\\]\\:h-\\(--radix-select-trigger-height\\)[data-position=popper]{height:var(--radix-select-trigger-height)}.data-\\[position\\=popper\\]\\:w-full[data-position=popper]{width:100%}.data-\\[position\\=popper\\]\\:min-w-\\(--radix-select-trigger-width\\)[data-position=popper]{min-width:var(--radix-select-trigger-width)}.data-\\[side\\=bottom\\]\\:translate-y-1[data-side=bottom]{--tw-translate-y:var(--spacing);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=bottom\\]\\:slide-in-from-top-2[data-side=bottom]{--tw-enter-translate-y:calc(2*var(--spacing)*-1)}.data-\\[side\\=left\\]\\:-translate-x-1[data-side=left]{--tw-translate-x:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=left\\]\\:slide-in-from-right-2[data-side=left]{--tw-enter-translate-x:calc(2*var(--spacing))}.data-\\[side\\=right\\]\\:translate-x-1[data-side=right]{--tw-translate-x:var(--spacing);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=right\\]\\:slide-in-from-left-2[data-side=right]{--tw-enter-translate-x:calc(2*var(--spacing)*-1)}.data-\\[side\\=top\\]\\:-translate-y-1[data-side=top]{--tw-translate-y:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=top\\]\\:slide-in-from-bottom-2[data-side=top]{--tw-enter-translate-y:calc(2*var(--spacing))}.data-\\[size\\=default\\]\\:h-8[data-size=default]{height:calc(var(--spacing) * 8)}.data-\\[size\\=default\\]\\:h-\\[18\\.4px\\][data-size=default]{height:18.4px}.data-\\[size\\=default\\]\\:w-\\[32px\\][data-size=default]{width:32px}.data-\\[size\\=default\\]\\:max-w-xs[data-size=default]{max-width:var(--container-xs)}.data-\\[size\\=sm\\]\\:h-7[data-size=sm]{height:calc(var(--spacing) * 7)}.data-\\[size\\=sm\\]\\:h-\\[14px\\][data-size=sm]{height:14px}.data-\\[size\\=sm\\]\\:w-\\[24px\\][data-size=sm]{width:24px}.data-\\[size\\=sm\\]\\:max-w-xs[data-size=sm]{max-width:var(--container-xs)}.data-\\[size\\=sm\\]\\:rounded-\\[min\\(var\\(--radius-md\\)\\,10px\\)\\][data-size=sm]{border-radius:min(var(--radius-md), 10px)}.data-\\[size\\=sm\\]\\:\\[--card-spacing\\:--spacing\\(3\\)\\][data-size=sm]{--card-spacing:calc(var(--spacing) * 3)}.data-\\[size\\=sm\\]\\:has-data-\\[slot\\=card-footer\\]\\:pb-0[data-size=sm]:has([data-slot=card-footer]){padding-bottom:0}:is(.\\*\\:data-\\[slot\\=alert-description\\]\\:text-destructive\\/90>*)[data-slot=alert-description]{color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:is(.\\*\\:data-\\[slot\\=alert-description\\]\\:text-destructive\\/90>*)[data-slot=alert-description]{color:color-mix(in oklab, var(--destructive) 90%, transparent)}}:is(.\\*\\:data-\\[slot\\=input-group-addon\\]\\:pl-2\\!>*)[data-slot=input-group-addon]{padding-left:calc(var(--spacing) * 2)!important}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:line-clamp-1>*)[data-slot=select-value]{-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:flex>*)[data-slot=select-value]{display:flex}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:items-center>*)[data-slot=select-value]{align-items:center}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:gap-1\\.5>*)[data-slot=select-value]{gap:calc(var(--spacing) * 1.5)}@supports ((-webkit-backdrop-filter:var(--tw)) or (backdrop-filter:var(--tw))){.supports-backdrop-filter\\:backdrop-blur-xs{--tw-backdrop-blur:blur(var(--blur-xs));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}}@media (prefers-reduced-motion:reduce){.motion-reduce\\:animate-none\\!{animation:none!important}}@media (width>=40rem){.sm\\:max-w-sm{max-width:var(--container-sm)}.sm\\:flex-row{flex-direction:row}.sm\\:items-end{align-items:flex-end}.sm\\:justify-between{justify-content:space-between}.sm\\:justify-end{justify-content:flex-end}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:row-span-2:is(:where(.group\\/alert-dialog-content)[data-size=default] *){grid-row:span 2/span 2}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:place-items-start:is(:where(.group\\/alert-dialog-content)[data-size=default] *){place-items:start}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:text-left:is(:where(.group\\/alert-dialog-content)[data-size=default] *){text-align:left}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:group-has-data-\\[slot\\=alert-dialog-media\\]\\/alert-dialog-content\\:col-start-2:is(:where(.group\\/alert-dialog-content)[data-size=default] *):is(:where(.group\\/alert-dialog-content):has([data-slot=alert-dialog-media]) *){grid-column-start:2}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:has-data-\\[slot\\=alert-dialog-media\\]\\:grid-rows-\\[auto_1fr\\]:is(:where(.group\\/alert-dialog-content)[data-size=default] *):has([data-slot=alert-dialog-media]){grid-template-rows:auto 1fr}.data-\\[size\\=default\\]\\:sm\\:max-w-sm[data-size=default]{max-width:var(--container-sm)}}@media (width>=48rem){.md\\:text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.md\\:text-pretty{text-wrap:pretty}}@media (width>=64rem){.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}.dark\\:border-input:is(.dark *){border-color:var(--input)}.dark\\:bg-destructive\\/20:is(.dark *){background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-destructive\\/20:is(.dark *){background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.dark\\:bg-input\\/30:is(.dark *){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-input\\/30:is(.dark *){background-color:color-mix(in oklab, var(--input) 30%, transparent)}}.dark\\:bg-transparent:is(.dark *){background-color:#0000}@media (hover:hover){.dark\\:hover\\:bg-destructive\\/30:is(.dark *):hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-destructive\\/30:is(.dark *):hover{background-color:color-mix(in oklab, var(--destructive) 30%, transparent)}}.dark\\:hover\\:bg-input\\/50:is(.dark *):hover{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-input\\/50:is(.dark *):hover{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.dark\\:hover\\:bg-muted\\/50:is(.dark *):hover{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-muted\\/50:is(.dark *):hover{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}}.dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.dark\\:disabled\\:bg-input\\/80:is(.dark *):disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:disabled\\:bg-input\\/80:is(.dark *):disabled{background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.dark\\:disabled\\:bg-transparent:is(.dark *):disabled{background-color:#0000}.dark\\:has-disabled\\:bg-input\\/80:is(.dark *):has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:has-disabled\\:bg-input\\/80:is(.dark *):has(:disabled){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:is(.dark *):has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:is(.dark *):has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.dark\\:aria-invalid\\:border-destructive\\/50:is(.dark *)[aria-invalid=true]{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:aria-invalid\\:border-destructive\\/50:is(.dark *)[aria-invalid=true]{border-color:color-mix(in oklab, var(--destructive) 50%, transparent)}}.dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.data-open\\:animate-dialog-in:where([data-state=open]),.data-open\\:animate-dialog-in:where([data-open]:not([data-open=false])){animation:.2s cubic-bezier(.16,1,.3,1) s4e-dialog-in}.data-open\\:animate-in:where([data-state=open]),.data-open\\:animate-in:where([data-open]:not([data-open=false])){animation:enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.data-open\\:animate-overlay-in:where([data-state=open]),.data-open\\:animate-overlay-in:where([data-open]:not([data-open=false])){animation:.2s cubic-bezier(.16,1,.3,1) s4e-overlay-in}.data-open\\:fade-in-0:where([data-state=open]),.data-open\\:fade-in-0:where([data-open]:not([data-open=false])){--tw-enter-opacity:0}.data-open\\:zoom-in-95:where([data-state=open]),.data-open\\:zoom-in-95:where([data-open]:not([data-open=false])){--tw-enter-scale:.95}.data-closed\\:animate-dialog-out:where([data-state=closed]),.data-closed\\:animate-dialog-out:where([data-closed]:not([data-closed=false])){animation:.12s cubic-bezier(.4,0,1,1) forwards s4e-dialog-out}.data-closed\\:animate-out:where([data-state=closed]),.data-closed\\:animate-out:where([data-closed]:not([data-closed=false])){animation:exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.data-closed\\:animate-overlay-out:where([data-state=closed]),.data-closed\\:animate-overlay-out:where([data-closed]:not([data-closed=false])){animation:.15s cubic-bezier(.4,0,1,1) forwards s4e-overlay-out}.data-closed\\:fade-out-0:where([data-state=closed]),.data-closed\\:fade-out-0:where([data-closed]:not([data-closed=false])){--tw-exit-opacity:0}.data-closed\\:zoom-out-95:where([data-state=closed]),.data-closed\\:zoom-out-95:where([data-closed]:not([data-closed=false])){--tw-exit-scale:.95}.data-checked\\:bg-primary:where([data-state=checked]),.data-checked\\:bg-primary:where([data-checked]:not([data-checked=false])){background-color:var(--primary)}.group-data-\\[size\\=default\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=default] *):where([data-state=checked]),.group-data-\\[size\\=default\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=default] *):where([data-checked]:not([data-checked=false])),.group-data-\\[size\\=sm\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=sm] *):where([data-state=checked]),.group-data-\\[size\\=sm\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=sm] *):where([data-checked]:not([data-checked=false])){--tw-translate-x:calc(100% - 2px);translate:var(--tw-translate-x) var(--tw-translate-y)}.dark\\:data-checked\\:bg-primary-foreground:is(.dark *):where([data-state=checked]),.dark\\:data-checked\\:bg-primary-foreground:is(.dark *):where([data-checked]:not([data-checked=false])){background-color:var(--primary-foreground)}.data-unchecked\\:bg-input:where([data-state=unchecked]),.data-unchecked\\:bg-input:where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}.group-data-\\[size\\=default\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=default] *):where([data-state=unchecked]),.group-data-\\[size\\=default\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=default] *):where([data-unchecked]:not([data-unchecked=false])),.group-data-\\[size\\=sm\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=sm] *):where([data-state=unchecked]),.group-data-\\[size\\=sm\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=sm] *):where([data-unchecked]:not([data-unchecked=false])){--tw-translate-x:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.dark\\:data-unchecked\\:bg-foreground:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-foreground:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:var(--foreground)}.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.data-selected\\:bg-muted:where([data-selected=true]){background-color:var(--muted)}.data-selected\\:text-foreground:where([data-selected=true]){color:var(--foreground)}.data-disabled\\:pointer-events-none:where([data-disabled=true]),.data-disabled\\:pointer-events-none:where([data-disabled]:not([data-disabled=false])){pointer-events:none}.data-disabled\\:cursor-not-allowed:where([data-disabled=true]),.data-disabled\\:cursor-not-allowed:where([data-disabled]:not([data-disabled=false])){cursor:not-allowed}.data-disabled\\:opacity-50:where([data-disabled=true]),.data-disabled\\:opacity-50:where([data-disabled]:not([data-disabled=false])){opacity:.5}.data-horizontal\\:h-px:where([data-orientation=horizontal]){height:1px}.data-horizontal\\:w-full:where([data-orientation=horizontal]){width:100%}.data-vertical\\:w-px:where([data-orientation=vertical]){width:1px}.data-vertical\\:self-stretch:where([data-orientation=vertical]){align-self:stretch}.\\[\\&_a\\]\\:underline a{text-decoration-line:underline}.\\[\\&_a\\]\\:underline-offset-3 a{text-underline-offset:3px}@media (hover:hover){.\\[\\&_a\\]\\:hover\\:text-foreground a:hover{color:var(--foreground)}}.\\[\\&_img\\]\\:size-full img{width:100%;height:100%}.\\[\\&_img\\]\\:object-cover img{object-fit:cover}.\\[\\&_p\\:not\\(\\:last-child\\)\\]\\:mb-4 p:not(:last-child){margin-bottom:calc(var(--spacing) * 4)}.\\[\\&_svg\\]\\:pointer-events-none svg{pointer-events:none}.\\[\\&_svg\\]\\:shrink-0 svg{flex-shrink:0}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3 svg:not([class*=size-]){width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3\\.5 svg:not([class*=size-]){width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4 svg:not([class*=size-]){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.\\[\\&\\+\\[data-slot\\=item-content\\]\\]\\:flex-none+[data-slot=item-content]{flex:none}.\\[\\.border-b\\]\\:pb-\\(--card-spacing\\).border-b{padding-bottom:var(--card-spacing)}.\\[\\.border-b\\]\\:pb-2.border-b{padding-bottom:calc(var(--spacing) * 2)}.\\[\\.border-t\\]\\:pt-2.border-t{padding-top:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:px-2 *)[cmdk-group-heading]{padding-inline:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:py-1\\.5 *)[cmdk-group-heading]{padding-block:calc(var(--spacing) * 1.5)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:text-xs *)[cmdk-group-heading]{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:font-medium *)[cmdk-group-heading]{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:text-muted-foreground *)[cmdk-group-heading]{color:var(--muted-foreground)}.\\[a\\]\\:transition-colors:is(a){transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}:is(.\\*\\:\\[a\\]\\:underline>*):is(a){text-decoration-line:underline}:is(.\\*\\:\\[a\\]\\:underline-offset-3>*):is(a){text-underline-offset:3px}@media (hover:hover){.\\[a\\]\\:hover\\:bg-muted:is(a):hover{background-color:var(--muted)}:is(.\\*\\:\\[a\\]\\:hover\\:text-foreground>*):is(a):hover{color:var(--foreground)}}:is(.\\*\\:\\[img\\:first-child\\]\\:rounded-t-xl>*):is(img:first-child){border-top-left-radius:calc(var(--radius) + 4px);border-top-right-radius:calc(var(--radius) + 4px)}:is(.\\*\\:\\[img\\:last-child\\]\\:rounded-b-xl>*):is(img:last-child){border-bottom-right-radius:calc(var(--radius) + 4px);border-bottom-left-radius:calc(var(--radius) + 4px)}:is(.\\*\\:\\[span\\]\\:last\\:flex>*):is(span):last-child{display:flex}:is(.\\*\\:\\[span\\]\\:last\\:items-center>*):is(span):last-child{align-items:center}:is(.\\*\\:\\[span\\]\\:last\\:gap-2>*):is(span):last-child{gap:calc(var(--spacing) * 2)}:is(.\\*\\:\\[svg\\]\\:row-span-2>*):is(svg){grid-row:span 2/span 2}:is(.\\*\\:\\[svg\\]\\:translate-y-0\\.5>*):is(svg){--tw-translate-y:calc(var(--spacing) * .5);translate:var(--tw-translate-x) var(--tw-translate-y)}:is(.\\*\\:\\[svg\\]\\:text-current>*):is(svg){color:currentColor}:is(.data-selected\\:\\*\\:\\[svg\\]\\:text-foreground:where([data-selected=true])>*):is(svg){color:var(--foreground)}:is(.\\*\\:\\[svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4>*):is(svg:not([class*=size-])){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}:is(.\\*\\:\\[svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-6>*):is(svg:not([class*=size-])){width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.\\[\\&\\>a\\]\\:underline>a{text-decoration-line:underline}.\\[\\&\\>a\\]\\:underline-offset-4>a{text-underline-offset:4px}.\\[\\&\\>a\\:hover\\]\\:text-primary>a:hover{color:var(--primary)}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:\\[\\&\\>input\\]\\:pt-3:has(>[data-align=block-end])>input{padding-top:calc(var(--spacing) * 3)}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:\\[\\&\\>input\\]\\:pb-3:has(>[data-align=block-start])>input{padding-bottom:calc(var(--spacing) * 3)}.has-\\[\\>\\[data-align\\=inline-end\\]\\]\\:\\[\\&\\>input\\]\\:pr-1\\.5:has(>[data-align=inline-end])>input{padding-right:calc(var(--spacing) * 1.5)}.has-\\[\\>\\[data-align\\=inline-start\\]\\]\\:\\[\\&\\>input\\]\\:pl-1\\.5:has(>[data-align=inline-start])>input{padding-left:calc(var(--spacing) * 1.5)}.\\[\\&\\>kbd\\]\\:rounded-\\[calc\\(var\\(--radius\\)-5px\\)\\]>kbd{border-radius:calc(var(--radius) - 5px)}.\\[\\&\\>svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3\\.5>svg:not([class*=size-]){width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.\\[\\&\\>svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4>svg:not([class*=size-]){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}}@property --tw-animation-delay{syntax:\"*\";inherits:false;initial-value:0s}@property --tw-animation-direction{syntax:\"*\";inherits:false;initial-value:normal}@property --tw-animation-duration{syntax:\"*\";inherits:false}@property --tw-animation-fill-mode{syntax:\"*\";inherits:false;initial-value:none}@property --tw-animation-iteration-count{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --scroll-fade-t{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-b{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-s{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-e{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-mask{syntax:\"*\";inherits:false}@property --shimmer-angle{syntax:\"<angle>\";inherits:true;initial-value:20deg}@property --shimmer-image{syntax:\"*\";inherits:false}@property --shimmer-text-fill{syntax:\"*\";inherits:false}@media (prefers-reduced-motion:reduce){.shimmer{-webkit-text-fill-color:currentColor;background-image:none;animation:none}}:root,:host,.palette-scope{--background:oklch(100% 0 0);--foreground:oklch(14.5% 0 0);--card:oklch(100% 0 0);--card-foreground:oklch(14.5% 0 0);--popover:oklch(100% 0 0);--popover-foreground:oklch(14.5% 0 0);--primary:oklch(20.5% 0 0);--primary-foreground:oklch(98.5% 0 0);--secondary:oklch(97% 0 0);--secondary-foreground:oklch(20.5% 0 0);--muted:oklch(97% 0 0);--muted-foreground:oklch(55.6% 0 0);--accent:oklch(97% 0 0);--accent-foreground:oklch(20.5% 0 0);--destructive:oklch(57.7% .245 27.325);--border:oklch(92.2% 0 0);--input:oklch(92.2% 0 0);--ring:oklch(70.8% 0 0);--chart-1:oklch(87% 0 0);--chart-2:oklch(55.6% 0 0);--chart-3:oklch(43.9% 0 0);--chart-4:oklch(37.1% 0 0);--chart-5:oklch(26.9% 0 0);--radius:.625rem;--sidebar:oklch(98.5% 0 0);--sidebar-foreground:oklch(14.5% 0 0);--sidebar-primary:oklch(20.5% 0 0);--sidebar-primary-foreground:oklch(98.5% 0 0);--sidebar-accent:oklch(97% 0 0);--sidebar-accent-foreground:oklch(20.5% 0 0);--sidebar-border:oklch(92.2% 0 0);--sidebar-ring:oklch(70.8% 0 0)}.dark,:host(.dark),.palette-scope.dark{--background:oklch(14.5% 0 0);--foreground:oklch(98.5% 0 0);--card:oklch(20.5% 0 0);--card-foreground:oklch(98.5% 0 0);--popover:oklch(20.5% 0 0);--popover-foreground:oklch(98.5% 0 0);--primary:oklch(92.2% 0 0);--primary-foreground:oklch(20.5% 0 0);--secondary:oklch(26.9% 0 0);--secondary-foreground:oklch(98.5% 0 0);--muted:oklch(26.9% 0 0);--muted-foreground:oklch(70.8% 0 0);--accent:oklch(26.9% 0 0);--accent-foreground:oklch(98.5% 0 0);--destructive:oklch(70.4% .191 22.216);--border:oklch(100% 0 0/.1);--input:oklch(100% 0 0/.15);--ring:oklch(55.6% 0 0);--chart-1:oklch(87% 0 0);--chart-2:oklch(55.6% 0 0);--chart-3:oklch(43.9% 0 0);--chart-4:oklch(37.1% 0 0);--chart-5:oklch(26.9% 0 0);--sidebar:oklch(20.5% 0 0);--sidebar-foreground:oklch(98.5% 0 0);--sidebar-primary:oklch(48.8% .243 264.376);--sidebar-primary-foreground:oklch(98.5% 0 0);--sidebar-accent:oklch(26.9% 0 0);--sidebar-accent-foreground:oklch(98.5% 0 0);--sidebar-border:oklch(100% 0 0/.1);--sidebar-ring:oklch(55.6% 0 0)}:host{all:initial;--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;font-family:var(--font-sans);font-synthesis:none;text-rendering:optimizelegibility}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial}}[data-slot=dialog-portal],[data-slot=dialog-overlay],[data-slot=dialog-content]{color:var(--foreground);font-family:var(--font-sans);font-synthesis:none;pointer-events:auto;line-height:1.5}@keyframes s4e-progress-indeterminate{0%{transform:translate(-100%)}to{transform:translate(350%)}}[data-slot=progress][data-indeterminate] [data-slot=progress-indicator]{animation:1.4s ease-in-out infinite s4e-progress-indeterminate}@media (prefers-reduced-motion:reduce){[data-slot=dialog-overlay],[data-slot=dialog-content],[data-slot=command].animate-surface-in{animation:none!important}}.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.scroll-fade{--fade-depth:1.5rem}.scroll-fade[data-fade-mask=top]{-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%)}.scroll-fade[data-fade-mask=bottom]{-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent)}.scroll-fade[data-fade-mask=both]{-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent)}@property --tw-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-z{syntax:\"*\";inherits:false;initial-value:0}@property --tw-scale-x{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-y{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-z{syntax:\"*\";inherits:false;initial-value:1}@property --tw-rotate-x{syntax:\"*\";inherits:false}@property --tw-rotate-y{syntax:\"*\";inherits:false}@property --tw-rotate-z{syntax:\"*\";inherits:false}@property --tw-skew-x{syntax:\"*\";inherits:false}@property --tw-skew-y{syntax:\"*\";inherits:false}@property --tw-pan-x{syntax:\"*\";inherits:false}@property --tw-pan-y{syntax:\"*\";inherits:false}@property --tw-pinch-zoom{syntax:\"*\";inherits:false}@property --tw-space-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-space-x-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-divide-x-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-border-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-divide-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-leading{syntax:\"*\";inherits:false}@property --tw-font-weight{syntax:\"*\";inherits:false}@property --tw-tracking{syntax:\"*\";inherits:false}@property --tw-ordinal{syntax:\"*\";inherits:false}@property --tw-slashed-zero{syntax:\"*\";inherits:false}@property --tw-numeric-figure{syntax:\"*\";inherits:false}@property --tw-numeric-spacing{syntax:\"*\";inherits:false}@property --tw-numeric-fraction{syntax:\"*\";inherits:false}@property --tw-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:\"*\";inherits:false}@property --tw-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:\"*\";inherits:false}@property --tw-inset-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:\"*\";inherits:false}@property --tw-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:\"*\";inherits:false}@property --tw-inset-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:\"*\";inherits:false}@property --tw-ring-offset-width{syntax:\"<length>\";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:\"*\";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-blur{syntax:\"*\";inherits:false}@property --tw-brightness{syntax:\"*\";inherits:false}@property --tw-contrast{syntax:\"*\";inherits:false}@property --tw-grayscale{syntax:\"*\";inherits:false}@property --tw-hue-rotate{syntax:\"*\";inherits:false}@property --tw-invert{syntax:\"*\";inherits:false}@property --tw-opacity{syntax:\"*\";inherits:false}@property --tw-saturate{syntax:\"*\";inherits:false}@property --tw-sepia{syntax:\"*\";inherits:false}@property --tw-drop-shadow{syntax:\"*\";inherits:false}@property --tw-drop-shadow-color{syntax:\"*\";inherits:false}@property --tw-drop-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:\"*\";inherits:false}@property --tw-backdrop-blur{syntax:\"*\";inherits:false}@property --tw-backdrop-brightness{syntax:\"*\";inherits:false}@property --tw-backdrop-contrast{syntax:\"*\";inherits:false}@property --tw-backdrop-grayscale{syntax:\"*\";inherits:false}@property --tw-backdrop-hue-rotate{syntax:\"*\";inherits:false}@property --tw-backdrop-invert{syntax:\"*\";inherits:false}@property --tw-backdrop-opacity{syntax:\"*\";inherits:false}@property --tw-backdrop-saturate{syntax:\"*\";inherits:false}@property --tw-backdrop-sepia{syntax:\"*\";inherits:false}@property --tw-duration{syntax:\"*\";inherits:false}@property --tw-ease{syntax:\"*\";inherits:false}@property --tw-content{syntax:\"*\";inherits:false;initial-value:\"\"}@keyframes spin{to{transform:rotate(360deg)}}@keyframes enter{0%{opacity:var(--tw-enter-opacity,1);transform:translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0)scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1))rotate(var(--tw-enter-rotate,0));filter:blur(var(--tw-enter-blur,0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity,1);transform:translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0)scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1))rotate(var(--tw-exit-rotate,0));filter:blur(var(--tw-exit-blur,0))}}@keyframes scroll-fade-reveal-t{0%{--scroll-fade-t:0px}to{--scroll-fade-t:var(--_scroll-fade-size-t,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))))}}@keyframes scroll-fade-reveal-b{0%{--scroll-fade-b:var(--_scroll-fade-size-b,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))))}to{--scroll-fade-b:0px}}@keyframes tw-shimmer{0%{background-position:100% 0}to{background-position:0 0}}@keyframes s4e-dialog-in{0%{opacity:0;transform:translateY(-4px)scale(.97)}}@keyframes s4e-dialog-out{to{opacity:0;transform:scale(.98)}}@keyframes s4e-overlay-in{0%{opacity:0}}@keyframes s4e-overlay-out{to{opacity:0}}@keyframes s4e-surface-in{0%{opacity:0;transform:translateY(2px)}}", b = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), x = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), S = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), C = (e) => {
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
}), ne = (e, t) => {
	let n = (0, _.forwardRef)(({ className: n, ...r }, i) => (0, _.createElement)(E, {
		ref: i,
		iconNode: t,
		className: b(`lucide-${x(C(e))}`, `lucide-${e}`, n),
		...r
	}));
	return n.displayName = C(e), n;
}, re = ne("building-2", [
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
]), ie = ne("check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]), ae = ne("chevron-left", [["path", {
	d: "m15 18-6-6 6-6",
	key: "1wnfg3"
}]]), oe = ne("circle", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}]]), D = ne("clock", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "M12 6v6l4 2",
	key: "mmk7yg"
}]]), O = ne("file-spreadsheet", [
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
]), k = ne("folder-open", [["path", {
	d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
	key: "usdka0"
}]]), A = ne("loader-circle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]), se = ne("package", [
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
]), ce = ne("search", [["path", {
	d: "m21 21-4.34-4.34",
	key: "14j7rj"
}], ["circle", {
	cx: "11",
	cy: "11",
	r: "8",
	key: "4ej97u"
}]]), le = ne("settings", [["path", {
	d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
	key: "1i5ecw"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]), ue = ne("truck", [
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
]), j = ne("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]);
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function M(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = M(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function de() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = M(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/class-variance-authority/dist/index.mjs
var N = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, fe = de, pe = (e, t) => (n) => {
	if (t?.variants == null) return fe(e, n?.class, n?.className);
	let { variants: r, defaultVariants: i } = t, a = Object.keys(r).map((e) => {
		let t = n?.[e], a = i?.[e];
		if (t === null) return null;
		let o = N(t) || N(a);
		return r[e][o];
	}), o = n && Object.entries(n).reduce((e, t) => {
		let [n, r] = t;
		return r === void 0 || (e[n] = r), e;
	}, {});
	return fe(e, a, t?.compoundVariants?.reduce((e, t) => {
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
}, me = (e, t) => {
	let n = Array(e.length + t.length);
	for (let t = 0; t < e.length; t++) n[t] = e[t];
	for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
	return n;
}, he = (e, t) => ({
	classGroupId: e,
	validator: t
}), ge = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
	nextPart: e,
	validators: t,
	classGroupId: n
}), _e = "-", ve = [], ye = "arbitrary..", be = (e) => {
	let t = Ce(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			if (e.startsWith("[") && e.endsWith("]")) return Se(e);
			let n = e.split(_e);
			return xe(n, +(n[0] === "" && n.length > 1), t);
		},
		getConflictingClassGroupIds: (e, t) => {
			if (t) {
				let t = r[e], i = n[e];
				return t ? i ? me(i, t) : t : i || ve;
			}
			return n[e] || ve;
		}
	};
}, xe = (e, t, n) => {
	if (e.length - t === 0) return n.classGroupId;
	let r = e[t], i = n.nextPart.get(r);
	if (i) {
		let n = xe(e, t + 1, i);
		if (n) return n;
	}
	let a = n.validators;
	if (a === null) return;
	let o = t === 0 ? e.join(_e) : e.slice(t).join(_e), s = a.length;
	for (let e = 0; e < s; e++) {
		let t = a[e];
		if (t.validator(o)) return t.classGroupId;
	}
}, Se = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	let t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
	return r ? ye + r : void 0;
})(), Ce = (e) => {
	let { theme: t, classGroups: n } = e;
	return we(n, t);
}, we = (e, t) => {
	let n = ge();
	for (let r in e) {
		let i = e[r];
		Te(i, n, r, t);
	}
	return n;
}, Te = (e, t, n, r) => {
	let i = e.length;
	for (let a = 0; a < i; a++) {
		let i = e[a];
		Ee(i, t, n, r);
	}
}, Ee = (e, t, n, r) => {
	if (typeof e == "string") {
		De(e, t, n);
		return;
	}
	if (typeof e == "function") {
		Oe(e, t, n, r);
		return;
	}
	ke(e, t, n, r);
}, De = (e, t, n) => {
	let r = e === "" ? t : Ae(t, e);
	r.classGroupId = n;
}, Oe = (e, t, n, r) => {
	if (je(e)) {
		Te(e(r), t, n, r);
		return;
	}
	t.validators === null && (t.validators = []), t.validators.push(he(n, e));
}, ke = (e, t, n, r) => {
	let i = Object.entries(e), a = i.length;
	for (let e = 0; e < a; e++) {
		let [a, o] = i[e];
		Te(o, Ae(t, a), n, r);
	}
}, Ae = (e, t) => {
	let n = e, r = t.split(_e), i = r.length;
	for (let e = 0; e < i; e++) {
		let t = r[e], i = n.nextPart.get(t);
		i || (i = ge(), n.nextPart.set(t, i)), n = i;
	}
	return n;
}, je = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, Me = (e) => {
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
}, Ne = "!", Pe = ":", Fe = [], Ie = (e, t, n, r, i) => ({
	modifiers: e,
	hasImportantModifier: t,
	baseClassName: n,
	maybePostfixModifierPosition: r,
	isExternal: i
}), Le = (e) => {
	let { prefix: t, experimentalParseClassName: n } = e, r = (e) => {
		let t = [], n = 0, r = 0, i = 0, a, o = e.length;
		for (let s = 0; s < o; s++) {
			let o = e[s];
			if (n === 0 && r === 0) {
				if (o === Pe) {
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
		s.endsWith(Ne) ? (c = s.slice(0, -1), l = !0) : s.startsWith(Ne) && (c = s.slice(1), l = !0);
		let u = a && a > i ? a - i : void 0;
		return Ie(t, l, c, u);
	};
	if (t) {
		let e = t + Pe, n = r;
		r = (t) => t.startsWith(e) ? n(t.slice(e.length)) : Ie(Fe, !1, t, void 0, !0);
	}
	if (n) {
		let e = r;
		r = (t) => n({
			className: t,
			parseClassName: e
		});
	}
	return r;
}, Re = (e) => {
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
}, ze = (e) => ({
	cache: Me(e.cacheSize),
	parseClassName: Le(e),
	sortModifiers: Re(e),
	postfixLookupClassGroupIds: Be(e),
	...be(e)
}), Be = (e) => {
	let t = Object.create(null), n = e.postfixLookupClassGroups;
	if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
	return t;
}, Ve = /\s+/, He = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i, sortModifiers: a, postfixLookupClassGroupIds: o } = t, s = [], c = e.trim().split(Ve), l = "";
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
		let _ = d.length === 0 ? "" : d.length === 1 ? d[0] : a(d).join(":"), v = f ? _ + Ne : _, y = v + g;
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
}, Ue = (...e) => {
	let t = 0, n, r, i = "";
	for (; t < e.length;) (n = e[t++]) && (r = We(n)) && (i && (i += " "), i += r);
	return i;
}, We = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = We(e[r])) && (n && (n += " "), n += t);
	return n;
}, Ge = (e, ...t) => {
	let n, r, i, a, o = (o) => (n = ze(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)), s = (e) => {
		let t = r(e);
		if (t) return t;
		let a = He(e, n);
		return i(e, a), a;
	};
	return a = o, (...e) => a(Ue(...e));
}, Ke = [], qe = (e) => {
	let t = (t) => t[e] || Ke;
	return t.isThemeGetter = !0, t;
}, Je = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, Ye = /^\((?:(\w[\w-]*):)?(.+)\)$/i, Xe = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/, Ze = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Qe = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, $e = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, et = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, tt = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, nt = (e) => Xe.test(e), P = (e) => !!e && !Number.isNaN(Number(e)), rt = (e) => !!e && Number.isInteger(Number(e)), it = (e) => e.endsWith("%") && P(e.slice(0, -1)), at = (e) => Ze.test(e), ot = () => !0, st = (e) => Qe.test(e) && !$e.test(e), ct = () => !1, lt = (e) => et.test(e), ut = (e) => tt.test(e), dt = (e) => !F(e) && !I(e), ft = (e) => e.startsWith("@container") && (e[10] === "/" && e[11] !== void 0 || e[11] === "s" && e[16] !== void 0 && e.startsWith("-size/", 10) || e[11] === "n" && e[18] !== void 0 && e.startsWith("-normal/", 10)), pt = (e) => Ot(e, Mt, ct), F = (e) => Je.test(e), mt = (e) => Ot(e, Nt, st), ht = (e) => Ot(e, Pt, P), gt = (e) => Ot(e, It, ot), _t = (e) => Ot(e, Ft, ct), vt = (e) => Ot(e, At, ct), yt = (e) => Ot(e, jt, ut), bt = (e) => Ot(e, Lt, lt), I = (e) => Ye.test(e), xt = (e) => kt(e, Nt), St = (e) => kt(e, Ft), Ct = (e) => kt(e, At), wt = (e) => kt(e, Mt), Tt = (e) => kt(e, jt), Et = (e) => kt(e, Lt, !0), Dt = (e) => kt(e, It, !0), Ot = (e, t, n) => {
	let r = Je.exec(e);
	return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, kt = (e, t, n = !1) => {
	let r = Ye.exec(e);
	return r ? r[1] ? t(r[1]) : n : !1;
}, At = (e) => e === "position" || e === "percentage", jt = (e) => e === "image" || e === "url", Mt = (e) => e === "length" || e === "size" || e === "bg-size", Nt = (e) => e === "length", Pt = (e) => e === "number", Ft = (e) => e === "family-name", It = (e) => e === "number" || e === "weight", Lt = (e) => e === "shadow", Rt = /*#__PURE__*/ Ge(() => {
	let e = qe("color"), t = qe("font"), n = qe("text"), r = qe("font-weight"), i = qe("tracking"), a = qe("leading"), o = qe("breakpoint"), s = qe("container"), c = qe("spacing"), l = qe("radius"), u = qe("shadow"), d = qe("inset-shadow"), f = qe("text-shadow"), p = qe("drop-shadow"), m = qe("blur"), h = qe("perspective"), g = qe("aspect"), _ = qe("ease"), v = qe("animate"), y = () => [
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
		I,
		F
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
		I,
		F,
		c
	], T = () => [
		nt,
		"full",
		"auto",
		...w()
	], ee = () => [
		rt,
		"none",
		"subgrid",
		I,
		F
	], te = () => [
		"auto",
		{ span: [
			"full",
			rt,
			I,
			F
		] },
		rt,
		I,
		F
	], E = () => [
		rt,
		"auto",
		I,
		F
	], ne = () => [
		"auto",
		"min",
		"max",
		"fr",
		I,
		F
	], re = () => [
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
	], ie = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	], ae = () => ["auto", ...w()], oe = () => [
		nt,
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
	], D = () => [
		nt,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...w()
	], O = () => [
		nt,
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
	], k = () => [
		e,
		I,
		F
	], A = () => [
		...b(),
		Ct,
		vt,
		{ position: [I, F] }
	], se = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }], ce = () => [
		"auto",
		"cover",
		"contain",
		wt,
		pt,
		{ size: [I, F] }
	], le = () => [
		it,
		xt,
		mt
	], ue = () => [
		"",
		"none",
		"full",
		l,
		I,
		F
	], j = () => [
		"",
		P,
		xt,
		mt
	], M = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	], de = () => [
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
	], N = () => [
		P,
		it,
		Ct,
		vt
	], fe = () => [
		"",
		"none",
		m,
		I,
		F
	], pe = () => [
		"none",
		P,
		I,
		F
	], me = () => [
		"none",
		P,
		I,
		F
	], he = () => [
		P,
		I,
		F
	], ge = () => [
		nt,
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
			blur: [at],
			breakpoint: [at],
			color: [ot],
			container: [at],
			"drop-shadow": [at],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [dt],
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
			"inset-shadow": [at],
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
			radius: [at],
			shadow: [at],
			spacing: ["px", P],
			text: [at],
			"text-shadow": [at],
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
				nt,
				F,
				I,
				g
			] }],
			container: ["container"],
			"container-type": [{ "@container": [
				"",
				"normal",
				"size",
				I,
				F
			] }],
			"container-named": [ft],
			columns: [{ columns: [
				P,
				F,
				I,
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
				rt,
				"auto",
				I,
				F
			] }],
			basis: [{ basis: [
				nt,
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
				P,
				nt,
				"auto",
				"initial",
				"none",
				F
			] }],
			grow: [{ grow: [
				"",
				P,
				I,
				F
			] }],
			shrink: [{ shrink: [
				"",
				P,
				I,
				F
			] }],
			order: [{ order: [
				rt,
				"first",
				"last",
				"none",
				I,
				F
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
			"auto-cols": [{ "auto-cols": ne() }],
			"auto-rows": [{ "auto-rows": ne() }],
			gap: [{ gap: w() }],
			"gap-x": [{ "gap-x": w() }],
			"gap-y": [{ "gap-y": w() }],
			"justify-content": [{ justify: [...re(), "normal"] }],
			"justify-items": [{ "justify-items": [...ie(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...ie()] }],
			"align-content": [{ content: ["normal", ...re()] }],
			"align-items": [{ items: [...ie(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...ie(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": re() }],
			"place-items": [{ "place-items": [...ie(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...ie()] }],
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
			m: [{ m: ae() }],
			mx: [{ mx: ae() }],
			my: [{ my: ae() }],
			ms: [{ ms: ae() }],
			me: [{ me: ae() }],
			mbs: [{ mbs: ae() }],
			mbe: [{ mbe: ae() }],
			mt: [{ mt: ae() }],
			mr: [{ mr: ae() }],
			mb: [{ mb: ae() }],
			ml: [{ ml: ae() }],
			"space-x": [{ "space-x": w() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": w() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: oe() }],
			"inline-size": [{ inline: ["auto", ...D()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...D()] }],
			"max-inline-size": [{ "max-inline": ["none", ...D()] }],
			"block-size": [{ block: ["auto", ...O()] }],
			"min-block-size": [{ "min-block": ["auto", ...O()] }],
			"max-block-size": [{ "max-block": ["none", ...O()] }],
			w: [{ w: [
				s,
				"screen",
				...oe()
			] }],
			"min-w": [{ "min-w": [
				s,
				"screen",
				"none",
				...oe()
			] }],
			"max-w": [{ "max-w": [
				s,
				"screen",
				"none",
				"prose",
				{ screen: [o] },
				...oe()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...oe()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...oe()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				...oe()
			] }],
			"font-size": [{ text: [
				"base",
				n,
				xt,
				mt
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				r,
				Dt,
				gt
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
				it,
				F
			] }],
			"font-family": [{ font: [
				St,
				_t,
				t
			] }],
			"font-features": [{ "font-features": [F] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				i,
				I,
				F
			] }],
			"line-clamp": [{ "line-clamp": [
				P,
				"none",
				I,
				ht
			] }],
			leading: [{ leading: [a, ...w()] }],
			"list-image": [{ "list-image": [
				"none",
				I,
				F
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				I,
				F
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: k() }],
			"text-color": [{ text: k() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...M(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				P,
				"from-font",
				"auto",
				I,
				mt
			] }],
			"text-decoration-color": [{ decoration: k() }],
			"underline-offset": [{ "underline-offset": [
				P,
				"auto",
				I,
				F
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
				rt,
				I,
				F
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
				I,
				F
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
				I,
				F
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
			"bg-position": [{ bg: A() }],
			"bg-repeat": [{ bg: se() }],
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
						rt,
						I,
						F
					],
					radial: [
						"",
						I,
						F
					],
					conic: [
						rt,
						I,
						F
					]
				},
				Tt,
				yt
			] }],
			"bg-color": [{ bg: k() }],
			"gradient-from-pos": [{ from: le() }],
			"gradient-via-pos": [{ via: le() }],
			"gradient-to-pos": [{ to: le() }],
			"gradient-from": [{ from: k() }],
			"gradient-via": [{ via: k() }],
			"gradient-to": [{ to: k() }],
			rounded: [{ rounded: ue() }],
			"rounded-s": [{ "rounded-s": ue() }],
			"rounded-e": [{ "rounded-e": ue() }],
			"rounded-t": [{ "rounded-t": ue() }],
			"rounded-r": [{ "rounded-r": ue() }],
			"rounded-b": [{ "rounded-b": ue() }],
			"rounded-l": [{ "rounded-l": ue() }],
			"rounded-ss": [{ "rounded-ss": ue() }],
			"rounded-se": [{ "rounded-se": ue() }],
			"rounded-ee": [{ "rounded-ee": ue() }],
			"rounded-es": [{ "rounded-es": ue() }],
			"rounded-tl": [{ "rounded-tl": ue() }],
			"rounded-tr": [{ "rounded-tr": ue() }],
			"rounded-br": [{ "rounded-br": ue() }],
			"rounded-bl": [{ "rounded-bl": ue() }],
			"border-w": [{ border: j() }],
			"border-w-x": [{ "border-x": j() }],
			"border-w-y": [{ "border-y": j() }],
			"border-w-s": [{ "border-s": j() }],
			"border-w-e": [{ "border-e": j() }],
			"border-w-bs": [{ "border-bs": j() }],
			"border-w-be": [{ "border-be": j() }],
			"border-w-t": [{ "border-t": j() }],
			"border-w-r": [{ "border-r": j() }],
			"border-w-b": [{ "border-b": j() }],
			"border-w-l": [{ "border-l": j() }],
			"divide-x": [{ "divide-x": j() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": j() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...M(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...M(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: k() }],
			"border-color-x": [{ "border-x": k() }],
			"border-color-y": [{ "border-y": k() }],
			"border-color-s": [{ "border-s": k() }],
			"border-color-e": [{ "border-e": k() }],
			"border-color-bs": [{ "border-bs": k() }],
			"border-color-be": [{ "border-be": k() }],
			"border-color-t": [{ "border-t": k() }],
			"border-color-r": [{ "border-r": k() }],
			"border-color-b": [{ "border-b": k() }],
			"border-color-l": [{ "border-l": k() }],
			"divide-color": [{ divide: k() }],
			"outline-style": [{ outline: [
				...M(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				P,
				I,
				F
			] }],
			"outline-w": [{ outline: [
				"",
				P,
				xt,
				mt
			] }],
			"outline-color": [{ outline: k() }],
			shadow: [{ shadow: [
				"",
				"none",
				u,
				Et,
				bt
			] }],
			"shadow-color": [{ shadow: k() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				d,
				Et,
				bt
			] }],
			"inset-shadow-color": [{ "inset-shadow": k() }],
			"ring-w": [{ ring: j() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: k() }],
			"ring-offset-w": [{ "ring-offset": [P, mt] }],
			"ring-offset-color": [{ "ring-offset": k() }],
			"inset-ring-w": [{ "inset-ring": j() }],
			"inset-ring-color": [{ "inset-ring": k() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				f,
				Et,
				bt
			] }],
			"text-shadow-color": [{ "text-shadow": k() }],
			opacity: [{ opacity: [
				P,
				I,
				F
			] }],
			"mix-blend": [{ "mix-blend": [
				...de(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": de() }],
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
			"mask-image-linear-pos": [{ "mask-linear": [P] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": N() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": N() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": k() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": k() }],
			"mask-image-t-from-pos": [{ "mask-t-from": N() }],
			"mask-image-t-to-pos": [{ "mask-t-to": N() }],
			"mask-image-t-from-color": [{ "mask-t-from": k() }],
			"mask-image-t-to-color": [{ "mask-t-to": k() }],
			"mask-image-r-from-pos": [{ "mask-r-from": N() }],
			"mask-image-r-to-pos": [{ "mask-r-to": N() }],
			"mask-image-r-from-color": [{ "mask-r-from": k() }],
			"mask-image-r-to-color": [{ "mask-r-to": k() }],
			"mask-image-b-from-pos": [{ "mask-b-from": N() }],
			"mask-image-b-to-pos": [{ "mask-b-to": N() }],
			"mask-image-b-from-color": [{ "mask-b-from": k() }],
			"mask-image-b-to-color": [{ "mask-b-to": k() }],
			"mask-image-l-from-pos": [{ "mask-l-from": N() }],
			"mask-image-l-to-pos": [{ "mask-l-to": N() }],
			"mask-image-l-from-color": [{ "mask-l-from": k() }],
			"mask-image-l-to-color": [{ "mask-l-to": k() }],
			"mask-image-x-from-pos": [{ "mask-x-from": N() }],
			"mask-image-x-to-pos": [{ "mask-x-to": N() }],
			"mask-image-x-from-color": [{ "mask-x-from": k() }],
			"mask-image-x-to-color": [{ "mask-x-to": k() }],
			"mask-image-y-from-pos": [{ "mask-y-from": N() }],
			"mask-image-y-to-pos": [{ "mask-y-to": N() }],
			"mask-image-y-from-color": [{ "mask-y-from": k() }],
			"mask-image-y-to-color": [{ "mask-y-to": k() }],
			"mask-image-radial": [{ "mask-radial": [I, F] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": N() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": N() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": k() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": k() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": b() }],
			"mask-image-conic-pos": [{ "mask-conic": [P] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": N() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": N() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": k() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": k() }],
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
			"mask-position": [{ mask: A() }],
			"mask-repeat": [{ mask: se() }],
			"mask-size": [{ mask: ce() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				I,
				F
			] }],
			filter: [{ filter: [
				"",
				"none",
				I,
				F
			] }],
			blur: [{ blur: fe() }],
			brightness: [{ brightness: [
				P,
				I,
				F
			] }],
			contrast: [{ contrast: [
				P,
				I,
				F
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				p,
				Et,
				bt
			] }],
			"drop-shadow-color": [{ "drop-shadow": k() }],
			grayscale: [{ grayscale: [
				"",
				P,
				I,
				F
			] }],
			"hue-rotate": [{ "hue-rotate": [
				P,
				I,
				F
			] }],
			invert: [{ invert: [
				"",
				P,
				I,
				F
			] }],
			saturate: [{ saturate: [
				P,
				I,
				F
			] }],
			sepia: [{ sepia: [
				"",
				P,
				I,
				F
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				I,
				F
			] }],
			"backdrop-blur": [{ "backdrop-blur": fe() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				P,
				I,
				F
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				P,
				I,
				F
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				P,
				I,
				F
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				P,
				I,
				F
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				P,
				I,
				F
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				P,
				I,
				F
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				P,
				I,
				F
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				P,
				I,
				F
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
				I,
				F
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				P,
				"initial",
				I,
				F
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				_,
				I,
				F
			] }],
			delay: [{ delay: [
				P,
				I,
				F
			] }],
			animate: [{ animate: [
				"none",
				v,
				I,
				F
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				h,
				I,
				F
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
				I,
				F,
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
				rt,
				I,
				F
			] }],
			accent: [{ accent: k() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: k() }],
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
				I,
				F
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
			"scrollbar-thumb-color": [{ "scrollbar-thumb": k() }],
			"scrollbar-track-color": [{ "scrollbar-track": k() }],
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
				I,
				F
			] }],
			fill: [{ fill: ["none", ...k()] }],
			"stroke-w": [{ stroke: [
				P,
				xt,
				mt,
				ht
			] }],
			stroke: [{ stroke: ["none", ...k()] }],
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
function L(...e) {
	return Rt(de(e));
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var zt = /* @__PURE__ */ o(((e) => {
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
})), R = (/* @__PURE__ */ o(((e, t) => {
	t.exports = zt();
})))(), Bt = pe("group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4", {
	variants: { variant: {
		default: "bg-card text-card-foreground",
		destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
	} },
	defaultVariants: { variant: "default" }
});
function Vt({ className: e, variant: t, ...n }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "alert",
		role: "alert",
		className: L(Bt({ variant: t }), e),
		...n
	});
}
function Ht({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "alert-title",
		className: L("font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground", e),
		...t
	});
}
function Ut({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "alert-description",
		className: L("text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4", e),
		...t
	});
}
//#endregion
//#region node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var Wt = Object.defineProperty, Gt = (e, t) => Wt(e, "name", {
	value: t,
	configurable: !0
});
function Kt(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
Gt(Kt, "setRef");
function qt(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = Kt(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : Kt(e[t], null);
			}
		};
	};
}
Gt(qt, "composeRefs");
function Jt(...e) {
	return _.useCallback(qt(...e), e);
}
Gt(Jt, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-slot/dist/index.mjs
var Yt = /* @__PURE__ */ c(m(), 1), Xt = Object.defineProperty, Zt = (e, t) => Xt(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function Qt(e) {
	let t = _.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		cn(r) && typeof fn == "function" && (r = fn(r._payload)), _.Children.forEach(r, (e) => {
			if (on(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				cn(n) && typeof fn == "function" && (n = fn(n._payload)), a = nn(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = _.cloneElement(a, void 0, s) : !o && _.Children.count(r) === 1 && _.isValidElement(r) && (a = r);
		let c = a ? an(a) : void 0, l = Jt(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? dn(e) : un(e));
			return r;
		}
		let u = rn(i, a.props ?? {});
		return a.type !== _.Fragment && (u.ref = n ? l : c), _.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
Zt(Qt, "createSlot");
var $t = /* @__PURE__ */ Qt("Slot"), en = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function tn(e) {
	let t = /* @__PURE__ */ Zt((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = en, t;
}
Zt(tn, "createSlottable");
var nn = /* @__PURE__ */ Zt((e, t) => {
	if ("child" in e.props) {
		let t = e.props.child;
		return _.isValidElement(t) ? _.cloneElement(t, void 0, e.props.children(t.props.children)) : null;
	}
	return _.isValidElement(t) ? t : null;
}, "getSlottableElementFromSlottable");
function rn(e, t) {
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
Zt(rn, "mergeProps");
function an(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Zt(an, "getElementRef");
function on(e) {
	return _.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === en;
}
Zt(on, "isSlottable");
var sn = Symbol.for("react.lazy");
function cn(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === sn && "_payload" in e && ln(e._payload);
}
Zt(cn, "isLazyComponent");
function ln(e) {
	return typeof e == "object" && !!e && "then" in e;
}
Zt(ln, "isPromiseLike");
var un = /* @__PURE__ */ Zt((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), dn = /* @__PURE__ */ Zt((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), fn = _.use, pn = Object.defineProperty, mn = (e, t) => pn(e, "name", {
	value: t,
	configurable: !0
}), hn = [
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
	let n = /* @__PURE__ */ Qt(`Primitive.${t}`), r = _.forwardRef((e, r) => {
		let { asChild: i, ...a } = e, o = i ? n : t;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, R.jsx)(o, {
			...a,
			ref: r
		});
	});
	return r.displayName = `Primitive.${t}`, {
		...e,
		[t]: r
	};
}, {});
function gn(e, t) {
	e && Yt.flushSync(() => e.dispatchEvent(t));
}
mn(gn, "dispatchDiscreteCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-context/dist/index.mjs
var _n = Object.defineProperty, vn = (e, t) => _n(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function yn(e, t) {
	let n = _.createContext(t);
	n.displayName = e + "Context";
	let r = /* @__PURE__ */ vn((e) => {
		let { children: t, ...r } = e, i = _.useMemo(() => r, Object.values(r));
		return /* @__PURE__ */ (0, R.jsx)(n.Provider, {
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
	return vn(i, "useContext"), [r, i];
}
vn(yn, "createContext");
// @__NO_SIDE_EFFECTS__
function bn(e, t = []) {
	let n = [];
	function r(t, r) {
		let i = _.createContext(r);
		i.displayName = t + "Context";
		let a = n.length;
		n = [...n, r];
		let o = /* @__PURE__ */ vn((t) => {
			let { scope: n, children: r, ...o } = t, s = n?.[e]?.[a] || i, c = _.useMemo(() => o, Object.values(o));
			return /* @__PURE__ */ (0, R.jsx)(s.Provider, {
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
		return vn(s, "useContext"), [o, s];
	}
	vn(r, "createContext");
	let i = /* @__PURE__ */ vn(() => {
		let t = n.map((e) => _.createContext(e));
		return /* @__PURE__ */ vn(function(n) {
			let r = n?.[e] || t;
			return _.useMemo(() => ({ [`__scope${e}`]: {
				...n,
				[e]: r
			} }), [n, r]);
		}, "useScope");
	}, "createScope");
	return i.scopeName = e, [r, xn(i, ...t)];
}
vn(bn, "createContextScope");
function xn(...e) {
	let t = e[0];
	if (e.length === 1) return t;
	let n = /* @__PURE__ */ vn(() => {
		let n = e.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return /* @__PURE__ */ vn(function(e) {
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
vn(xn, "composeContextScopes");
//#endregion
//#region node_modules/@radix-ui/primitive/dist/index.mjs
var Sn = Object.defineProperty, Cn = (e, t) => Sn(e, "name", {
	value: t,
	configurable: !0
}), wn = !!(typeof window < "u" && window.document && window.document.createElement);
function Tn(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return /* @__PURE__ */ Cn(function(r) {
		if (e?.(r), n === !1 || !r || !r.defaultPrevented) return t?.(r);
	}, "handleEvent");
}
Cn(Tn, "composeEventHandlers");
function En(e) {
	if (!wn) throw Error("Cannot access window outside of the DOM");
	return e?.ownerDocument?.defaultView ?? window;
}
Cn(En, "getOwnerWindow");
function Dn(e) {
	if (!wn) throw Error("Cannot access document outside of the DOM");
	return e?.ownerDocument ?? document;
}
Cn(Dn, "getOwnerDocument");
function On(e, t = !1) {
	let { activeElement: n } = Dn(e);
	if (!n?.nodeName) return null;
	if (kn(n) && n.contentDocument) return On(n.contentDocument.body, t);
	if (t) {
		let e = n.getAttribute("aria-activedescendant");
		if (e) {
			let t = Dn(n).getElementById(e);
			if (t) return t;
		}
	}
	return n;
}
Cn(On, "getActiveElement");
function kn(e) {
	return e.tagName === "IFRAME";
}
Cn(kn, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var An = globalThis?.document ? _.useLayoutEffect : () => {}, jn = Object.defineProperty, Mn = (e, t) => jn(e, "name", {
	value: t,
	configurable: !0
}), Nn = _.useEffectEvent, Pn = _.useInsertionEffect;
function Fn(e) {
	if (typeof Nn == "function") return Nn(e);
	let t = _.useRef(() => {
		throw Error("Cannot call an event handler while rendering.");
	});
	return typeof Pn == "function" ? Pn(() => {
		t.current = e;
	}) : An(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
Mn(Fn, "useEffectEvent");
//#endregion
//#region node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var In = Object.defineProperty, Ln = (e, t) => In(e, "name", {
	value: t,
	configurable: !0
}), Rn = _.useInsertionEffect || An;
function zn({ prop: e, defaultProp: t, onChange: n = /* @__PURE__ */ Ln(() => {}, "onChange"), caller: r }) {
	let [i, a, o] = Bn({
		defaultProp: t,
		onChange: n
	}), s = e !== void 0;
	return [s ? e : i, _.useCallback((t) => {
		if (s) {
			let n = Vn(t) ? t(e) : t;
			n !== e && o.current?.(n);
		} else a(t);
	}, [
		s,
		e,
		a,
		o
	])];
}
Ln(zn, "useControllableState");
function Bn({ defaultProp: e, onChange: t }) {
	let [n, r] = _.useState(e), i = _.useRef(n), a = _.useRef(t);
	return Rn(() => {
		a.current = t;
	}, [t]), _.useEffect(() => {
		i.current !== n && (a.current?.(n), i.current = n);
	}, [n, i]), [
		n,
		r,
		a
	];
}
Ln(Bn, "useUncontrolledState");
function Vn(e) {
	return typeof e == "function";
}
Ln(Vn, "isFunction");
var Hn = Symbol("RADIX:SYNC_STATE");
function Un(e, t, n, r) {
	let { prop: i, defaultProp: a, onChange: o, caller: s } = t, c = i !== void 0, l = Fn(o), u = [{
		...n,
		state: a
	}];
	r && u.push(r);
	let [d, f] = _.useReducer((t, n) => {
		if (n.type === Hn) return {
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
			type: Hn,
			state: i
		});
	}, [
		i,
		d.state,
		c
	]), [h, f];
}
Ln(Un, "useControllableStateReducer");
//#endregion
//#region node_modules/@radix-ui/react-presence/dist/index.mjs
var Wn = Object.defineProperty, Gn = (e, t) => Wn(e, "name", {
	value: t,
	configurable: !0
});
function Kn(e, t) {
	return _.useReducer((e, n) => t[e][n] ?? e, e);
}
Gn(Kn, "useStateMachine");
var qn = /* @__PURE__ */ Gn((e) => {
	let { present: t, children: n } = e, r = Jn(t), i = typeof n == "function" ? n({ present: r.isPresent }) : _.Children.only(n), a = Xn(r.ref, Qn(i));
	return typeof n == "function" || r.isPresent ? _.cloneElement(i, { ref: a }) : null;
}, "Presence");
function Jn(e) {
	let [t, n] = _.useState(), r = _.useRef(null), i = _.useRef(e), a = _.useRef("none"), o = _.useRef(void 0), [s, c] = Kn(e ? "mounted" : "unmounted", {
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
		s === "mounted" ? (a.current = o.current ?? Zn(r.current), o.current = void 0) : a.current = "none";
	}, [s]), An(() => {
		let t = r.current, n = i.current;
		if (n !== e) {
			let r = a.current, s = Zn(t);
			e ? (o.current = s, c("MOUNT")) : s === "none" || t?.display === "none" ? c("UNMOUNT") : c(n && r !== s ? "ANIMATION_OUT" : "UNMOUNT"), i.current = e;
		}
	}, [e, c]), An(() => {
		if (t) {
			let e, n = t.ownerDocument.defaultView ?? window, o = /* @__PURE__ */ Gn((a) => {
				let o = Zn(r.current).includes(CSS.escape(a.animationName));
				if (a.target === t && o && (c("ANIMATION_END"), !i.current)) {
					let r = t.style.animationFillMode;
					t.style.animationFillMode = "forwards", e = n.setTimeout(() => {
						t.style.animationFillMode === "forwards" && (t.style.animationFillMode = r);
					});
				}
			}, "handleAnimationEnd"), s = /* @__PURE__ */ Gn((e) => {
				e.target === t && (a.current = Zn(r.current));
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
				r.current = t, o.current = Zn(t);
			} else r.current = null;
			n(e);
		}, [])
	};
}
Gn(Jn, "usePresence");
function Yn(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
Gn(Yn, "setRef");
function Xn(...e) {
	let t = _.useRef(e);
	return t.current = e, _.useCallback((e) => {
		let n = t.current, r = !1, i = n.map((t) => {
			let n = Yn(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				typeof t == "function" ? t() : Yn(n[e], null);
			}
		};
	}, []);
}
Gn(Xn, "useStableComposedRefs");
function Zn(e) {
	return e?.animationName || "none";
}
Gn(Zn, "getAnimationName");
function Qn(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Gn(Qn, "getElementRef");
//#endregion
//#region node_modules/@radix-ui/react-id/dist/index.mjs
var $n = Object.defineProperty, er = (e, t) => $n(e, "name", {
	value: t,
	configurable: !0
}), tr = _.useId || (() => void 0), nr = 0;
function rr(e) {
	let [t, n] = _.useState(tr());
	return An(() => {
		e || n((e) => e ?? String(nr++));
	}, [e]), e || (t ? `radix-${t}` : "");
}
er(rr, "useId");
//#endregion
//#region node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var ir = Object.defineProperty, ar = (e, t) => ir(e, "name", {
	value: t,
	configurable: !0
});
function or(e) {
	let t = _.useRef(e);
	return _.useEffect(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
ar(or, "useCallbackRef");
//#endregion
//#region node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var sr = Object.defineProperty, cr = (e, t) => sr(e, "name", {
	value: t,
	configurable: !0
}), lr = "dismissableLayer.update", ur = "dismissableLayer.pointerDownOutside", dr = "dismissableLayer.focusOutside", fr, pr = _.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set(),
	dismissableSurfaces: /* @__PURE__ */ new Set()
}), mr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ cr(function(e, t) {
	let { disableOutsidePointerEvents: n = !1, deferPointerDownOutside: r = !1, onEscapeKeyDown: i, onPointerDownOutside: a, onFocusOutside: o, onInteractOutside: s, onDismiss: c, ...l } = e, u = _.useContext(pr), [d, f] = _.useState(null), p = d?.ownerDocument ?? globalThis?.document, [, m] = _.useState({}), h = Jt(t, f), g = Array.from(u.layers), [v] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), y = v ? g.indexOf(v) : -1, b = d ? g.indexOf(d) : -1, x = u.layersWithOutsidePointerEventsDisabled.size > 0, S = b >= y, C = _.useRef(!1), w = _r((e) => {
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
	}), T = vr((e) => {
		if (r && C.current) return;
		let t = e.target;
		[...u.branches].some((e) => e.contains(t)) || (o?.(e), s?.(e), e.defaultPrevented || c?.());
	}, p), ee = d ? b === g.length - 1 : !1, te = or((e) => {
		e.key === "Escape" && (i?.(e), !e.defaultPrevented && c && (e.preventDefault(), c()));
	});
	return _.useEffect(() => {
		if (ee) return p.addEventListener("keydown", te, { capture: !0 }), () => p.removeEventListener("keydown", te, { capture: !0 });
	}, [
		p,
		ee,
		te
	]), _.useEffect(() => {
		if (d) return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (fr = p.body.style.pointerEvents, p.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(d)), u.layers.add(d), yr(), () => {
			n && (u.layersWithOutsidePointerEventsDisabled.delete(d), u.layersWithOutsidePointerEventsDisabled.size === 0 && (p.body.style.pointerEvents = fr));
		};
	}, [
		d,
		p,
		n,
		u
	]), _.useEffect(() => () => {
		d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), yr());
	}, [d, u]), _.useEffect(() => {
		let e = /* @__PURE__ */ cr(() => m({}), "handleUpdate");
		return document.addEventListener(lr, e), () => document.removeEventListener(lr, e);
	}, []), /* @__PURE__ */ (0, R.jsx)(hn.div, {
		...l,
		ref: h,
		style: {
			pointerEvents: x ? S ? "auto" : "none" : void 0,
			...e.style
		},
		onFocusCapture: Tn(e.onFocusCapture, T.onFocusCapture),
		onBlurCapture: Tn(e.onBlurCapture, T.onBlurCapture),
		onPointerDownCapture: Tn(e.onPointerDownCapture, w.onPointerDownCapture)
	});
}, "DismissableLayer"));
function hr() {
	let e = _.useContext(pr), [t, n] = _.useState(null);
	return _.useEffect(() => {
		if (t) return e.dismissableSurfaces.add(t), () => {
			e.dismissableSurfaces.delete(t);
		};
	}, [t, e.dismissableSurfaces]), n;
}
cr(hr, "useDismissableLayerSurface");
var gr = /* @__PURE__ */ cr(() => !0, "IS_TRUE");
function _r(e, t) {
	let { ownerDocument: n = globalThis?.document, deferPointerDownOutside: r = !1, isDeferredPointerDownOutsideRef: i, dismissableSurfaces: a, shouldHandlePointerDownOutside: o = gr } = t, s = or(e), c = _.useRef(!1), l = _.useRef(!1), u = _.useRef(/* @__PURE__ */ new Map()), d = _.useRef(() => {});
	return _.useEffect(() => {
		function e() {
			l.current = !1, i.current = !1, u.current.clear();
		}
		cr(e, "resetOutsideInteraction");
		function t() {
			return Array.from(u.current.values()).some(Boolean);
		}
		cr(t, "isOutsideInteractionIntercepted");
		function f(e) {
			if (!l.current) return;
			let t = e.target;
			t instanceof Node && [...a].some((e) => e.contains(t)) || u.current.set(e.type, !0), e.type === "click" && window.setTimeout(() => {
				l.current && d.current();
			}, 0);
		}
		cr(f, "handleInteractionCapture");
		function p(e) {
			l.current && u.current.set(e.type, !1);
		}
		cr(p, "handleInteractionBubble");
		let m = /* @__PURE__ */ cr((a) => {
			if (a.target && !c.current) {
				let f = function() {
					n.removeEventListener("click", d.current);
					let r = t();
					e(), r || br(ur, s, p, { discrete: !0 });
				};
				if (cr(f, "handleAndDispatchPointerDownOutsideEvent"), !o(a.target)) {
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
	]), { onPointerDownCapture: /* @__PURE__ */ cr(() => c.current = !0, "onPointerDownCapture") };
}
cr(_r, "usePointerDownOutside");
function vr(e, t = globalThis?.document) {
	let n = or(e), r = _.useRef(!1);
	return _.useEffect(() => {
		let e = /* @__PURE__ */ cr((e) => {
			e.target && !r.current && br(dr, n, { originalEvent: e }, { discrete: !1 });
		}, "handleFocus");
		return t.addEventListener("focusin", e), () => t.removeEventListener("focusin", e);
	}, [t, n]), {
		onFocusCapture: /* @__PURE__ */ cr(() => r.current = !0, "onFocusCapture"),
		onBlurCapture: /* @__PURE__ */ cr(() => r.current = !1, "onBlurCapture")
	};
}
cr(vr, "useFocusOutside");
function yr() {
	let e = new CustomEvent(lr);
	document.dispatchEvent(e);
}
cr(yr, "dispatchUpdate");
function br(e, t, n, { discrete: r }) {
	let i = n.originalEvent.target, a = new CustomEvent(e, {
		bubbles: !1,
		cancelable: !0,
		detail: n
	});
	t && i.addEventListener(e, t, { once: !0 }), r ? gn(i, a) : i.dispatchEvent(a);
}
cr(br, "handleAndDispatchCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var xr = Object.defineProperty, z = (e, t) => xr(e, "name", {
	value: t,
	configurable: !0
}), Sr = "focusScope.autoFocusOnMount", Cr = "focusScope.autoFocusOnUnmount", wr = {
	bubbles: !1,
	cancelable: !0
}, Tr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ z(function(e, t) {
	let { loop: n = !1, trapped: r = !1, onMountAutoFocus: i, onUnmountAutoFocus: a, ...o } = e, [s, c] = _.useState(null), l = or(i), u = or(a), d = _.useRef(null), f = Jt(t, c), p = _.useRef({
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
				s.contains(t) ? d.current = t : Mr(d.current, { select: !0 });
			}, t = function(e) {
				if (p.paused || !s) return;
				let t = e.relatedTarget;
				t !== null && (s.contains(t) || Mr(d.current, { select: !0 }));
			}, n = function(e) {
				if (document.activeElement === document.body) for (let t of e) t.removedNodes.length > 0 && Mr(s);
			};
			z(e, "handleFocusIn"), z(t, "handleFocusOut"), z(n, "handleMutations"), document.addEventListener("focusin", e), document.addEventListener("focusout", t);
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
			Nr.add(p);
			let e = document.activeElement;
			if (!s.contains(e)) {
				let t = new CustomEvent(Sr, wr);
				s.addEventListener(Sr, l), s.dispatchEvent(t), t.defaultPrevented || (Er(Ir(Or(s)), { select: !0 }), document.activeElement === e && Mr(s));
			}
			return () => {
				s.removeEventListener(Sr, l), setTimeout(() => {
					let t = new CustomEvent(Cr, wr);
					s.addEventListener(Cr, u), s.dispatchEvent(t), t.defaultPrevented || Mr(e ?? document.body, { select: !0 }), s.removeEventListener(Cr, u), Nr.remove(p);
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
			let t = e.currentTarget, [r, a] = Dr(t);
			r && a ? !e.shiftKey && i === a ? (e.preventDefault(), n && Mr(r, { select: !0 })) : e.shiftKey && i === r && (e.preventDefault(), n && Mr(a, { select: !0 })) : i === t && e.preventDefault();
		}
	}, [
		n,
		r,
		p.paused
	]);
	return /* @__PURE__ */ (0, R.jsx)(hn.div, {
		tabIndex: -1,
		...o,
		ref: f,
		onKeyDown: m
	});
}, "FocusScope"));
function Er(e, { select: t = !1 } = {}) {
	let n = document.activeElement;
	for (let r of e) if (Mr(r, { select: t }), document.activeElement !== n) return;
}
z(Er, "focusFirst");
function Dr(e) {
	let t = Or(e);
	return [kr(t, e), kr(t.reverse(), e)];
}
z(Dr, "getTabbableEdges");
function Or(e) {
	let t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: /* @__PURE__ */ z((e) => {
		let t = e.tagName === "INPUT" && e.type === "hidden";
		return e.disabled || e.hidden || t ? NodeFilter.FILTER_SKIP : e.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	}, "acceptNode") });
	for (; n.nextNode();) t.push(n.currentNode);
	return t;
}
z(Or, "getTabbableCandidates");
function kr(e, t) {
	let n = typeof t.checkVisibility == "function" && t.checkVisibility({ checkVisibilityCSS: !0 });
	for (let r of e) if (!(n ? !r.checkVisibility({ checkVisibilityCSS: !0 }) : Ar(r, { upTo: t }))) return r;
}
z(kr, "findVisible");
function Ar(e, { upTo: t }) {
	if (getComputedStyle(e).visibility === "hidden") return !0;
	for (; e;) {
		if (t !== void 0 && e === t) return !1;
		if (getComputedStyle(e).display === "none") return !0;
		e = e.parentElement;
	}
	return !1;
}
z(Ar, "isHidden");
function jr(e) {
	return e instanceof HTMLInputElement && "select" in e;
}
z(jr, "isSelectableInput");
function Mr(e, { select: t = !1 } = {}) {
	if (e && e.focus) {
		let n = document.activeElement;
		e.focus({ preventScroll: !0 }), e !== n && jr(e) && t && e.select();
	}
}
z(Mr, "focus");
var Nr = Pr();
function Pr() {
	let e = [];
	return {
		add(t) {
			let n = e[0];
			t !== n && n?.pause(), e = Fr(e, t), e.unshift(t);
		},
		remove(t) {
			e = Fr(e, t), e[0]?.resume();
		}
	};
}
z(Pr, "createFocusScopesStack");
function Fr(e, t) {
	let n = [...e], r = n.indexOf(t);
	return r !== -1 && n.splice(r, 1), n;
}
z(Fr, "arrayRemove");
function Ir(e) {
	return e.filter((e) => e.tagName !== "A");
}
z(Ir, "removeLinks");
//#endregion
//#region node_modules/@radix-ui/react-portal/dist/index.mjs
var Lr = Object.defineProperty, Rr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ((e, t) => Lr(e, "name", {
	value: t,
	configurable: !0
}))(function(e, t) {
	let { container: n, ...r } = e, [i, a] = _.useState(!1);
	An(() => a(!0), []);
	let o = n || i && globalThis?.document?.body;
	return o ? Yt.createPortal(/* @__PURE__ */ (0, R.jsx)(hn.div, {
		...r,
		ref: t
	}), o) : null;
}, "Portal")), zr = Object.defineProperty, Br = (e, t) => zr(e, "name", {
	value: t,
	configurable: !0
}), Vr = 0, Hr = null;
function Ur(e) {
	return Wr(), e.children;
}
Br(Ur, "FocusGuards");
function Wr() {
	_.useEffect(() => {
		Hr ||= {
			start: Gr(),
			end: Gr()
		};
		let { start: e, end: t } = Hr;
		return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), Vr++, () => {
			Vr === 1 && (Hr?.start.remove(), Hr?.end.remove(), Hr = null), Vr = Math.max(0, Vr - 1);
		};
	}, []);
}
Br(Wr, "useFocusGuards");
function Gr() {
	let e = document.createElement("span");
	return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
Br(Gr, "createFocusGuard");
//#endregion
//#region node_modules/tslib/tslib.es6.mjs
var Kr = function() {
	return Kr = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Kr.apply(this, arguments);
};
function qr(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function Jr(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var Yr = "right-scroll-bar-position", Xr = "width-before-scroll-bar", Zr = "with-scroll-bars-hidden", Qr = "--removed-body-scroll-bar-size";
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/assignRef.js
function $r(e, t) {
	return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/useRef.js
function ei(e, t) {
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
var ti = typeof window < "u" ? _.useLayoutEffect : _.useEffect, ni = /* @__PURE__ */ new WeakMap();
function ri(e, t) {
	var n = ei(t || null, function(t) {
		return e.forEach(function(e) {
			return $r(e, t);
		});
	});
	return ti(function() {
		var t = ni.get(n);
		if (t) {
			var r = new Set(t), i = new Set(e), a = n.current;
			r.forEach(function(e) {
				i.has(e) || $r(e, null);
			}), i.forEach(function(e) {
				r.has(e) || $r(e, a);
			});
		}
		ni.set(n, e);
	}, [e]), n;
}
//#endregion
//#region node_modules/use-sidecar/dist/es2015/medium.js
function ii(e) {
	return e;
}
function ai(e, t) {
	t === void 0 && (t = ii);
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
function oi(e) {
	e === void 0 && (e = {});
	var t = ai(null);
	return t.options = Kr({
		async: !0,
		ssr: !1
	}, e), t;
}
//#endregion
//#region node_modules/use-sidecar/dist/es2015/exports.js
var si = function(e) {
	var t = e.sideCar, n = qr(e, ["sideCar"]);
	if (!t) throw Error("Sidecar: please provide `sideCar` property to import the right car");
	var r = t.read();
	if (!r) throw Error("Sidecar medium not found");
	return _.createElement(r, Kr({}, n));
};
si.isSideCarExport = !0;
function ci(e, t) {
	return e.useMedium(t), si;
}
//#endregion
//#region node_modules/react-remove-scroll/dist/es2015/medium.js
var li = oi(), ui = function() {}, di = _.forwardRef(function(e, t) {
	var n = _.useRef(null), r = _.useState({
		onScrollCapture: ui,
		onWheelCapture: ui,
		onTouchMoveCapture: ui
	}), i = r[0], a = r[1], o = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, g = e.allowPinchZoom, v = e.as, y = v === void 0 ? "div" : v, b = e.gapMode, x = qr(e, [
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
	]), S = f, C = ri([n, t]), w = Kr(Kr({}, x), i);
	return _.createElement(_.Fragment, null, u && _.createElement(S, {
		sideCar: li,
		removeScrollBar: l,
		shards: d,
		noRelative: p,
		noIsolation: m,
		inert: h,
		setCallbacks: a,
		allowPinchZoom: !!g,
		lockRef: n,
		gapMode: b
	}), o ? _.cloneElement(_.Children.only(s), Kr(Kr({}, w), { ref: C })) : _.createElement(y, Kr({}, w, {
		className: c,
		ref: C
	}), s));
});
di.defaultProps = {
	enabled: !0,
	removeScrollBar: !0,
	inert: !1
}, di.classNames = {
	fullWidth: Xr,
	zeroRight: Yr
};
//#endregion
//#region node_modules/get-nonce/dist/es2015/index.js
var fi, pi = function() {
	if (fi) return fi;
	if (typeof __webpack_nonce__ < "u") return __webpack_nonce__;
};
//#endregion
//#region node_modules/react-style-singleton/dist/es2015/singleton.js
function mi() {
	if (!document) return null;
	var e = document.createElement("style");
	e.type = "text/css";
	var t = pi();
	return t && e.setAttribute("nonce", t), e;
}
function hi(e, t) {
	e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function gi(e) {
	(document.head || document.getElementsByTagName("head")[0]).appendChild(e);
}
var _i = function() {
	var e = 0, t = null;
	return {
		add: function(n) {
			e == 0 && (t = mi()) && (hi(t, n), gi(t)), e++;
		},
		remove: function() {
			e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
		}
	};
}, vi = function() {
	var e = _i();
	return function(t, n) {
		_.useEffect(function() {
			return e.add(t), function() {
				e.remove();
			};
		}, [t && n]);
	};
}, yi = function() {
	var e = vi();
	return function(t) {
		var n = t.styles, r = t.dynamic;
		return e(n, r), null;
	};
}, bi = {
	left: 0,
	top: 0,
	right: 0,
	gap: 0
}, xi = function(e) {
	return parseInt(e || "", 10) || 0;
}, Si = function(e) {
	var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], i = t[e === "padding" ? "paddingRight" : "marginRight"];
	return [
		xi(n),
		xi(r),
		xi(i)
	];
}, Ci = function(e) {
	if (e === void 0 && (e = "margin"), typeof window > "u") return bi;
	var t = Si(e), n = document.documentElement.clientWidth, r = window.innerWidth;
	return {
		left: t[0],
		top: t[1],
		right: t[2],
		gap: Math.max(0, r - n + t[2] - t[0])
	};
}, wi = yi(), Ti = "data-scroll-locked", Ei = function(e, t, n, r) {
	var i = e.left, a = e.top, o = e.right, s = e.gap;
	return n === void 0 && (n = "margin"), `
  .${Zr} {
   overflow: hidden ${r};
   padding-right: ${s}px ${r};
  }
  body[${Ti}] {
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
  
  .${Yr} {
    right: ${s}px ${r};
  }
  
  .${Xr} {
    margin-right: ${s}px ${r};
  }
  
  .${Yr} .${Yr} {
    right: 0 ${r};
  }
  
  .${Xr} .${Xr} {
    margin-right: 0 ${r};
  }
  
  body[${Ti}] {
    ${Qr}: ${s}px;
  }
`;
}, Di = function() {
	var e = parseInt(document.body.getAttribute("data-scroll-locked") || "0", 10);
	return isFinite(e) ? e : 0;
}, Oi = function() {
	_.useEffect(function() {
		return document.body.setAttribute(Ti, (Di() + 1).toString()), function() {
			var e = Di() - 1;
			e <= 0 ? document.body.removeAttribute(Ti) : document.body.setAttribute(Ti, e.toString());
		};
	}, []);
}, ki = function(e) {
	var t = e.noRelative, n = e.noImportant, r = e.gapMode, i = r === void 0 ? "margin" : r;
	Oi();
	var a = _.useMemo(function() {
		return Ci(i);
	}, [i]);
	return _.createElement(wi, { styles: Ei(a, !t, i, n ? "" : "!important") });
}, Ai = !1;
if (typeof window < "u") try {
	var ji = Object.defineProperty({}, "passive", { get: function() {
		return Ai = !0, !0;
	} });
	window.addEventListener("test", ji, ji), window.removeEventListener("test", ji, ji);
} catch {
	Ai = !1;
}
var Mi = Ai ? { passive: !1 } : !1, Ni = function(e) {
	return e.tagName === "TEXTAREA";
}, B = function(e, t) {
	if (!(e instanceof Element)) return !1;
	var n = window.getComputedStyle(e);
	return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !Ni(e) && n[t] === "visible");
}, Pi = function(e) {
	return B(e, "overflowY");
}, Fi = function(e) {
	return B(e, "overflowX");
}, Ii = function(e, t) {
	var n = t.ownerDocument, r = t;
	do {
		if (typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host), zi(e, r)) {
			var i = Bi(e, r);
			if (i[1] > i[2]) return !0;
		}
		r = r.parentNode;
	} while (r && r !== n.body);
	return !1;
}, Li = function(e) {
	return [
		e.scrollTop,
		e.scrollHeight,
		e.clientHeight
	];
}, Ri = function(e) {
	return [
		e.scrollLeft,
		e.scrollWidth,
		e.clientWidth
	];
}, zi = function(e, t) {
	return e === "v" ? Pi(t) : Fi(t);
}, Bi = function(e, t) {
	return e === "v" ? Li(t) : Ri(t);
}, Vi = function(e, t) {
	return e === "h" && t === "rtl" ? -1 : 1;
}, Hi = function(e, t, n, r, i) {
	var a = Vi(e, window.getComputedStyle(t).direction), o = a * r, s = n.target, c = t.contains(s), l = !1, u = o > 0, d = 0, f = 0;
	do {
		if (!s) break;
		var p = Bi(e, s), m = p[0], h = p[1] - p[2] - a * m;
		(m || h) && zi(e, s) && (d += h, f += m);
		var g = s.parentNode;
		s = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
	} while (!c && s !== document.body || c && (t.contains(s) || t === s));
	return (u && (i && Math.abs(d) < 1 || !i && o > d) || !u && (i && Math.abs(f) < 1 || !i && -o > f)) && (l = !0), l;
}, Ui = function(e) {
	return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Wi = function(e) {
	return [e.deltaX, e.deltaY];
}, Gi = function(e) {
	return e && "current" in e ? e.current : e;
}, Ki = function(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}, qi = function(e) {
	return `
  .block-interactivity-${e} {pointer-events: none;}
  .allow-interactivity-${e} {pointer-events: all;}
`;
}, Ji = 0, Yi = [];
function Xi(e) {
	var t = _.useRef([]), n = _.useRef([0, 0]), r = _.useRef(), i = _.useState(Ji++)[0], a = _.useState(yi)[0], o = _.useRef(e);
	_.useEffect(function() {
		o.current = e;
	}, [e]), _.useEffect(function() {
		if (e.inert) {
			document.body.classList.add(`block-interactivity-${i}`);
			var t = Jr([e.lockRef.current], (e.shards || []).map(Gi), !0).filter(Boolean);
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
		var i = Ui(e), a = n.current, s = "deltaX" in e ? e.deltaX : a[0] - i[0], c = "deltaY" in e ? e.deltaY : a[1] - i[1], l, u = e.target, d = Math.abs(s) > Math.abs(c) ? "h" : "v";
		if ("touches" in e && d === "h" && u.type === "range") return !1;
		var f = window.getSelection(), p = f && f.anchorNode;
		if (p && (p === u || p.contains(u))) return !1;
		var m = Ii(d, u);
		if (!m) return !0;
		if (m ? l = d : (l = d === "v" ? "h" : "v", m = Ii(d, u)), !m) return !1;
		if (!r.current && "changedTouches" in e && (s || c) && (r.current = l), !l) return !0;
		var h = r.current || l;
		return Hi(h, t, e, h === "h" ? s : c, !0);
	}, []), c = _.useCallback(function(e) {
		var n = e;
		if (!(!Yi.length || Yi[Yi.length - 1] !== a)) {
			var r = "deltaY" in n ? Wi(n) : Ui(n), i = t.current.filter(function(e) {
				return e.name === n.type && (e.target === n.target || n.target === e.shadowParent) && Ki(e.delta, r);
			})[0];
			if (i && i.should) {
				n.cancelable && n.preventDefault();
				return;
			}
			if (!i) {
				var c = (o.current.shards || []).map(Gi).filter(Boolean).filter(function(e) {
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
			shadowParent: Zi(r)
		};
		t.current.push(a), setTimeout(function() {
			t.current = t.current.filter(function(e) {
				return e !== a;
			});
		}, 1);
	}, []), u = _.useCallback(function(e) {
		n.current = Ui(e), r.current = void 0;
	}, []), d = _.useCallback(function(t) {
		l(t.type, Wi(t), t.target, s(t, e.lockRef.current));
	}, []), f = _.useCallback(function(t) {
		l(t.type, Ui(t), t.target, s(t, e.lockRef.current));
	}, []);
	_.useEffect(function() {
		return Yi.push(a), e.setCallbacks({
			onScrollCapture: d,
			onWheelCapture: d,
			onTouchMoveCapture: f
		}), document.addEventListener("wheel", c, Mi), document.addEventListener("touchmove", c, Mi), document.addEventListener("touchstart", u, Mi), function() {
			Yi = Yi.filter(function(e) {
				return e !== a;
			}), document.removeEventListener("wheel", c, Mi), document.removeEventListener("touchmove", c, Mi), document.removeEventListener("touchstart", u, Mi);
		};
	}, []);
	var p = e.removeScrollBar, m = e.inert;
	return _.createElement(_.Fragment, null, m ? _.createElement(a, { styles: qi(i) }) : null, p ? _.createElement(ki, {
		noRelative: e.noRelative,
		gapMode: e.gapMode
	}) : null);
}
function Zi(e) {
	for (var t = null; e !== null;) e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
	return t;
}
//#endregion
//#region node_modules/react-remove-scroll/dist/es2015/sidecar.js
var Qi = ci(li, Xi), $i = _.forwardRef(function(e, t) {
	return _.createElement(di, Kr({}, e, {
		ref: t,
		sideCar: Qi
	}));
});
$i.classNames = di.classNames;
//#endregion
//#region node_modules/aria-hidden/dist/es2015/index.js
var ea = function(e) {
	return typeof document > "u" ? null : (Array.isArray(e) ? e[0] : e).ownerDocument.body;
}, ta = /* @__PURE__ */ new WeakMap(), na = /* @__PURE__ */ new WeakMap(), ra = {}, ia = 0, aa = function(e) {
	return e && (e.host || aa(e.parentNode));
}, oa = function(e, t) {
	return t.map(function(t) {
		if (e.contains(t)) return t;
		var n = aa(t);
		return n && e.contains(n) ? n : (console.error("aria-hidden", t, "in not contained inside", e, ". Doing nothing"), null);
	}).filter(function(e) {
		return !!e;
	});
}, sa = function(e, t, n, r) {
	var i = oa(t, Array.isArray(e) ? e : [e]);
	ra[n] || (ra[n] = /* @__PURE__ */ new WeakMap());
	var a = ra[n], o = [], s = /* @__PURE__ */ new Set(), c = new Set(i), l = function(e) {
		!e || s.has(e) || (s.add(e), l(e.parentNode));
	};
	i.forEach(l);
	var u = function(e) {
		!e || c.has(e) || Array.prototype.forEach.call(e.children, function(e) {
			if (s.has(e)) u(e);
			else try {
				var t = e.getAttribute(r), i = t !== null && t !== "false", c = (ta.get(e) || 0) + 1, l = (a.get(e) || 0) + 1;
				ta.set(e, c), a.set(e, l), o.push(e), c === 1 && i && na.set(e, !0), l === 1 && e.setAttribute(n, "true"), i || e.setAttribute(r, "true");
			} catch (t) {
				console.error("aria-hidden: cannot operate on ", e, t);
			}
		});
	};
	return u(t), s.clear(), ia++, function() {
		o.forEach(function(e) {
			var t = ta.get(e) - 1, i = a.get(e) - 1;
			ta.set(e, t), a.set(e, i), t || (na.has(e) || e.removeAttribute(r), na.delete(e)), i || e.removeAttribute(n);
		}), ia--, ia || (ta = /* @__PURE__ */ new WeakMap(), ta = /* @__PURE__ */ new WeakMap(), na = /* @__PURE__ */ new WeakMap(), ra = {});
	};
}, ca = function(e, t, n) {
	n === void 0 && (n = "data-aria-hidden");
	var r = Array.from(Array.isArray(e) ? e : [e]), i = t || ea(e);
	return i ? (r.push.apply(r, Array.from(i.querySelectorAll("[aria-live], script"))), sa(r, i, n, "aria-hidden")) : function() {
		return null;
	};
}, la = Object.defineProperty, ua = (e, t) => la(e, "name", {
	value: t,
	configurable: !0
}), da = "Dialog", [fa, pa] = /* @__PURE__ */ bn(da), [ma, ha] = fa(da), ga = /* @__PURE__ */ ua((e) => {
	let { __scopeDialog: t, children: n, open: r, defaultOpen: i, onOpenChange: a, modal: o = !0 } = e, s = _.useRef(null), c = _.useRef(null), [l, u] = zn({
		prop: r,
		defaultProp: i ?? !1,
		onChange: a,
		caller: da
	}), [d, f] = _.useState(0), [p, m] = _.useState(0);
	return /* @__PURE__ */ (0, R.jsx)(ma, {
		scope: t,
		triggerRef: s,
		contentRef: c,
		contentId: rr(),
		titleId: rr(),
		descriptionId: rr(),
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
}, "Dialog"), _a = "DialogPortal", [va, ya] = fa(_a, { forceMount: void 0 }), ba = /* @__PURE__ */ ua((e) => {
	let { __scopeDialog: t, forceMount: n, children: r, container: i } = e, a = ha(_a, t);
	return /* @__PURE__ */ (0, R.jsx)(va, {
		scope: t,
		forceMount: n,
		children: _.Children.map(r, (e) => /* @__PURE__ */ (0, R.jsx)(qn, {
			present: n || a.open,
			children: /* @__PURE__ */ (0, R.jsx)(Rr, {
				asChild: !0,
				container: i,
				children: e
			})
		}))
	});
}, "DialogPortal"), xa = "DialogOverlay", Sa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let n = ya(xa, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = ha(xa, e.__scopeDialog);
	return a.modal ? /* @__PURE__ */ (0, R.jsx)(qn, {
		present: r || a.open,
		children: /* @__PURE__ */ (0, R.jsx)(wa, {
			...i,
			ref: t
		})
	}) : null;
}, "DialogOverlay")), Ca = /* @__PURE__ */ Qt("DialogOverlay.RemoveScroll"), wa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ha(xa, n), a = Jt(t, hr());
	return /* @__PURE__ */ (0, R.jsx)($i, {
		as: Ca,
		allowPinchZoom: !0,
		shards: [i.contentRef],
		children: /* @__PURE__ */ (0, R.jsx)(hn.div, {
			"data-state": Ia(i.open),
			...r,
			ref: a,
			style: {
				pointerEvents: "auto",
				...r.style
			}
		})
	});
}, "DialogOverlayImpl")), Ta = "DialogContent", Ea = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let n = ya(Ta, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = ha(Ta, e.__scopeDialog);
	return /* @__PURE__ */ (0, R.jsx)(qn, {
		present: r || a.open,
		children: a.modal ? /* @__PURE__ */ (0, R.jsx)(Da, {
			...i,
			ref: t
		}) : /* @__PURE__ */ (0, R.jsx)(Oa, {
			...i,
			ref: t
		})
	});
}, "DialogContent")), Da = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let n = ha(Ta, e.__scopeDialog), r = _.useRef(null), i = Jt(t, n.contentRef, r);
	return _.useEffect(() => {
		let e = r.current;
		if (e) return ca(e);
	}, []), /* @__PURE__ */ (0, R.jsx)(ka, {
		...e,
		ref: i,
		trapFocus: n.open,
		disableOutsidePointerEvents: n.open,
		onCloseAutoFocus: Tn(e.onCloseAutoFocus, (e) => {
			e.preventDefault(), n.triggerRef.current?.focus();
		}),
		onPointerDownOutside: Tn(e.onPointerDownOutside, (e) => {
			let t = e.detail.originalEvent, n = t.button === 0 && t.ctrlKey === !0;
			(t.button === 2 || n) && e.preventDefault();
		}),
		onFocusOutside: Tn(e.onFocusOutside, (e) => e.preventDefault())
	});
}, "DialogContentModal")), Oa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let n = ha(Ta, e.__scopeDialog), r = _.useRef(!1), i = _.useRef(!1);
	return /* @__PURE__ */ (0, R.jsx)(ka, {
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
}, "DialogContentNonModal")), ka = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: i, onCloseAutoFocus: a, ...o } = e, s = ha(Ta, n);
	return Wr(), /* @__PURE__ */ (0, R.jsx)(R.Fragment, { children: /* @__PURE__ */ (0, R.jsx)(Tr, {
		asChild: !0,
		loop: !0,
		trapped: r,
		onMountAutoFocus: i,
		onUnmountAutoFocus: a,
		children: /* @__PURE__ */ (0, R.jsx)(mr, {
			role: "dialog",
			id: s.contentId,
			"aria-describedby": s.descriptionPresent ? s.descriptionId : void 0,
			"aria-labelledby": s.titlePresent ? s.titleId : void 0,
			"data-state": Ia(s.open),
			...o,
			ref: t,
			deferPointerDownOutside: !0,
			onDismiss: () => s.onOpenChange(!1)
		})
	}) });
}, "DialogContentImpl")), Aa = "DialogTitle", ja = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ha(Aa, n), { setTitleCount: a } = i;
	return An(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, R.jsx)(hn.h2, {
		id: i.titleId,
		...r,
		ref: t
	});
}, "DialogTitle")), Ma = "DialogDescription", Na = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ha(Ma, n), { setDescriptionCount: a } = i;
	return An(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, R.jsx)(hn.p, {
		id: i.descriptionId,
		...r,
		ref: t
	});
}, "DialogDescription")), Pa = "DialogClose", Fa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ua(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ha(Pa, n);
	return /* @__PURE__ */ (0, R.jsx)(hn.button, {
		type: "button",
		...r,
		ref: t,
		onClick: Tn(e.onClick, () => i.onOpenChange(!1))
	});
}, "DialogClose"));
function Ia(e) {
	return e ? "open" : "closed";
}
ua(Ia, "getState");
//#endregion
//#region node_modules/@radix-ui/react-label/dist/index.mjs
var La = Object.defineProperty, Ra = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ((e, t) => La(e, "name", {
	value: t,
	configurable: !0
}))(function(e, t) {
	return /* @__PURE__ */ (0, R.jsx)(hn.label, {
		...e,
		ref: t,
		onMouseDown: (t) => {
			t.target.closest("button, input, select, textarea") || (e.onMouseDown?.(t), !t.defaultPrevented && t.detail > 1 && t.preventDefault());
		}
	});
}, "Label")), za = Object.defineProperty, Ba = (e, t) => za(e, "name", {
	value: t,
	configurable: !0
}), Va = "Progress", Ha = 100, [Ua, Wa] = /* @__PURE__ */ bn(Va), [Ga, Ka] = Ua(Va), qa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Ba(function(e, t) {
	let { __scopeProgress: n, value: r = null, max: i, getValueLabel: a = Xa, ...o } = e;
	(i || i === 0) && !$a(i) && console.error(to(`${i}`, "Progress"));
	let s = $a(i) ? i : Ha;
	r !== null && !eo(r, s) && console.error(no(`${r}`, "Progress"));
	let c = eo(r, s) ? r : null, l = Qa(c) ? a(c, s) : void 0;
	return /* @__PURE__ */ (0, R.jsx)(Ga, {
		scope: n,
		value: c,
		max: s,
		children: /* @__PURE__ */ (0, R.jsx)(hn.div, {
			"aria-valuemax": s,
			"aria-valuemin": 0,
			"aria-valuenow": Qa(c) ? c : void 0,
			"aria-valuetext": l,
			role: "progressbar",
			"data-state": Za(c, s),
			"data-value": c ?? void 0,
			"data-max": s,
			...o,
			ref: t
		})
	});
}, "Progress")), Ja = "ProgressIndicator", Ya = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Ba(function(e, t) {
	let { __scopeProgress: n, ...r } = e, i = Ka(Ja, n);
	return /* @__PURE__ */ (0, R.jsx)(hn.div, {
		"data-state": Za(i.value, i.max),
		"data-value": i.value ?? void 0,
		"data-max": i.max,
		...r,
		ref: t
	});
}, "ProgressIndicator"));
function Xa(e, t) {
	return `${Math.round(e / t * 100)}%`;
}
Ba(Xa, "defaultGetValueLabel");
function Za(e, t) {
	return e == null ? "indeterminate" : e === t ? "complete" : "loading";
}
Ba(Za, "getProgressState");
function Qa(e) {
	return typeof e == "number";
}
Ba(Qa, "isNumber");
function $a(e) {
	return Qa(e) && !isNaN(e) && e > 0;
}
Ba($a, "isValidMaxNumber");
function eo(e, t) {
	return Qa(e) && !isNaN(e) && e <= t && e >= 0;
}
Ba(eo, "isValidValueNumber");
function to(e, t) {
	return `Invalid prop \`max\` of value \`${e}\` supplied to \`${t}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${Ha}\`.`;
}
Ba(to, "getInvalidMaxError");
function no(e, t) {
	return `Invalid prop \`value\` of value \`${e}\` supplied to \`${t}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${Ha} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
Ba(no, "getInvalidValueError");
var ro = qa, io = Ya, ao = pe("group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
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
function oo({ className: e, variant: t = "default", size: n = "default", asChild: r = !1, ...i }) {
	let a = r ? $t : "button";
	return /* @__PURE__ */ (0, R.jsx)(a, {
		"data-slot": "button",
		"data-variant": t,
		"data-size": n,
		className: L(ao({
			variant: t,
			size: n,
			className: e
		})),
		...i
	});
}
//#endregion
//#region node_modules/cmdk/dist/chunk-NZJY6EH4.mjs
var so = 1, co = .9, lo = .8, uo = .17, fo = .1, V = .999, H = .9999, po = .99, mo = /[\\\/_+.#"@\[\(\{&]/, ho = /[\\\/_+.#"@\[\(\{&]/g, go = /[\s-]/, _o = /[\s-]/g;
function vo(e, t, n, r, i, a, o) {
	if (a === t.length) return i === e.length ? so : po;
	var s = `${i},${a}`;
	if (o[s] !== void 0) return o[s];
	for (var c = r.charAt(a), l = n.indexOf(c, i), u = 0, d, f, p, m; l >= 0;) d = vo(e, t, n, r, l + 1, a + 1, o), d > u && (l === i ? d *= so : mo.test(e.charAt(l - 1)) ? (d *= lo, p = e.slice(i, l - 1).match(ho), p && i > 0 && (d *= V ** +p.length)) : go.test(e.charAt(l - 1)) ? (d *= co, m = e.slice(i, l - 1).match(_o), m && i > 0 && (d *= V ** +m.length)) : (d *= uo, i > 0 && (d *= V ** +(l - i))), e.charAt(l) !== t.charAt(a) && (d *= H)), (d < fo && n.charAt(l - 1) === r.charAt(a + 1) || r.charAt(a + 1) === r.charAt(a) && n.charAt(l - 1) !== r.charAt(a)) && (f = vo(e, t, n, r, l + 1, a + 2, o), f * fo > d && (d = f * fo)), d > u && (u = d), l = n.indexOf(c, l + 1);
	return o[s] = u, u;
}
function yo(e) {
	return e.toLowerCase().replace(_o, " ");
}
function bo(e, t, n) {
	return e = n && n.length > 0 ? `${e + " " + n.join(" ")}` : e, vo(e, t, yo(e), yo(t), 0, 0, {});
}
//#endregion
//#region node_modules/cmdk/dist/index.mjs
var xo = "[cmdk-group=\"\"]", So = "[cmdk-group-items=\"\"]", Co = "[cmdk-group-heading=\"\"]", wo = "[cmdk-item=\"\"]", To = `${wo}:not([aria-disabled="true"])`, Eo = "cmdk-item-select", Do = "data-value", Oo = (e, t, n) => bo(e, t, n), ko = _.createContext(void 0), Ao = () => _.useContext(ko), jo = _.createContext(void 0), Mo = () => _.useContext(jo), No = _.createContext(void 0), Po = _.forwardRef((e, t) => {
	let n = Jo(() => ({
		search: "",
		value: e.value ?? e.defaultValue ?? "",
		selectedItemId: void 0,
		filtered: {
			count: 0,
			items: /* @__PURE__ */ new Map(),
			groups: /* @__PURE__ */ new Set()
		}
	})), r = Jo(() => /* @__PURE__ */ new Set()), i = Jo(() => /* @__PURE__ */ new Map()), a = Jo(() => /* @__PURE__ */ new Map()), o = Jo(() => /* @__PURE__ */ new Set()), s = Ko(e), { label: c, children: l, value: u, onValueChange: d, filter: f, shouldFilter: p, loop: m, disablePointerSelection: h = !1, vimBindings: g = !0, ...v } = e, y = rr(), b = rr(), x = rr(), S = _.useRef(null), C = Zo();
	qo(() => {
		if (u !== void 0) {
			let e = u.trim();
			n.current.value = e, w.emit();
		}
	}, [u]), qo(() => {
		C(6, re);
	}, []);
	let w = _.useMemo(() => ({
		subscribe: (e) => (o.current.add(e), () => o.current.delete(e)),
		snapshot: () => n.current,
		setState: (e, t, r) => {
			var i, a, o;
			if (!Object.is(n.current[e], t)) {
				if (n.current[e] = t, e === "search") ne(), te(), C(1, E);
				else if (e === "value") {
					if (document.activeElement.hasAttribute("cmdk-input") || document.activeElement.hasAttribute("cmdk-root")) {
						let e = document.getElementById(x);
						e ? e.focus() : (i = document.getElementById(y)) == null || i.focus();
					}
					if (C(7, () => {
						n.current.selectedItemId = ie()?.id, w.emit();
					}), r || C(5, re), s.current?.value !== void 0) {
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
			ne(), te(), n.current.value || E(), w.emit();
		}), () => {
			a.current.delete(e), r.current.delete(e), n.current.filtered.items.delete(e);
			let t = ie();
			C(4, () => {
				ne(), t?.getAttribute("id") === e && E(), w.emit();
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
		let r = s.current?.filter ?? Oo;
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
		ae().sort((t, n) => {
			let r = t.getAttribute("id"), i = n.getAttribute("id");
			return (e.get(i) ?? 0) - (e.get(r) ?? 0);
		}).forEach((e) => {
			let t = e.closest(So);
			t ? t.appendChild(e.parentElement === t ? e : e.closest(`${So} > *`)) : r.appendChild(e.parentElement === r ? e : e.closest(`${So} > *`));
		}), t.sort((e, t) => t[1] - e[1]).forEach((e) => {
			let t = S.current?.querySelector(`${xo}[${Do}="${encodeURIComponent(e[0])}"]`);
			t?.parentElement.appendChild(t);
		});
	}
	function E() {
		let e = ae().find((e) => e.getAttribute("aria-disabled") !== "true")?.getAttribute(Do);
		w.setState("value", e || void 0);
	}
	function ne() {
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
	function re() {
		var e;
		let t = ie();
		t && (t.parentElement?.firstChild === t && ((e = t.closest(xo)?.querySelector(Co)) == null || e.scrollIntoView({ block: "nearest" })), t.scrollIntoView({ block: "nearest" }));
	}
	function ie() {
		return S.current?.querySelector(`${wo}[aria-selected="true"]`);
	}
	function ae() {
		return Array.from(S.current?.querySelectorAll(To) || []);
	}
	function oe(e) {
		let t = ae()[e];
		t && w.setState("value", t.getAttribute(Do));
	}
	function D(e) {
		var t;
		let n = ie(), r = ae(), i = r.findIndex((e) => e === n), a = r[i + e];
		(t = s.current) != null && t.loop && (a = i + e < 0 ? r[r.length - 1] : i + e === r.length ? r[0] : r[i + e]), a && w.setState("value", a.getAttribute(Do));
	}
	function O(e) {
		let t = ie()?.closest(xo), n;
		for (; t && !n;) t = e > 0 ? Wo(t, xo) : Go(t, xo), n = t?.querySelector(To);
		n ? w.setState("value", n.getAttribute(Do)) : D(e);
	}
	let k = () => oe(ae().length - 1), A = (e) => {
		e.preventDefault(), e.metaKey ? k() : e.altKey ? O(1) : D(1);
	}, se = (e) => {
		e.preventDefault(), e.metaKey ? oe(0) : e.altKey ? O(-1) : D(-1);
	};
	return _.createElement(hn.div, {
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
					g && e.ctrlKey && A(e);
					break;
				case "ArrowDown":
					A(e);
					break;
				case "p":
				case "k":
					g && e.ctrlKey && se(e);
					break;
				case "ArrowUp":
					se(e);
					break;
				case "Home":
					e.preventDefault(), oe(0);
					break;
				case "End":
					e.preventDefault(), k();
					break;
				case "Enter": {
					e.preventDefault();
					let t = ie();
					if (t) {
						let e = new Event(Eo);
						t.dispatchEvent(e);
					}
				}
			}
		}
	}, _.createElement("label", {
		"cmdk-label": "",
		htmlFor: T.inputId,
		id: T.labelId,
		style: es
	}, c), $o(e, (e) => _.createElement(jo.Provider, { value: w }, _.createElement(ko.Provider, { value: T }, e))));
}), Fo = _.forwardRef((e, t) => {
	let n = rr(), r = _.useRef(null), i = _.useContext(No), a = Ao(), o = Ko(e), s = o.current?.forceMount ?? i?.forceMount;
	qo(() => {
		if (!s) return a.item(n, i?.id);
	}, [s]);
	let c = Xo(n, r, [
		e.value,
		e.children,
		r
	], e.keywords), l = Mo(), u = Yo((e) => e.value && e.value === c.current), d = Yo((e) => s || a.filter() === !1 ? !0 : !e.search || e.filtered.items.get(n) > 0);
	_.useEffect(() => {
		let t = r.current;
		if (!(!t || e.disabled)) return t.addEventListener(Eo, f), () => t.removeEventListener(Eo, f);
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
	return _.createElement(hn.div, {
		ref: qt(r, t),
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
}), Io = _.forwardRef((e, t) => {
	let { heading: n, children: r, forceMount: i, ...a } = e, o = rr(), s = _.useRef(null), c = _.useRef(null), l = rr(), u = Ao(), d = Yo((e) => i || u.filter() === !1 ? !0 : !e.search || e.filtered.groups.has(o));
	qo(() => u.group(o), []), Xo(o, s, [
		e.value,
		e.heading,
		c
	]);
	let f = _.useMemo(() => ({
		id: o,
		forceMount: i
	}), [i]);
	return _.createElement(hn.div, {
		ref: qt(s, t),
		...a,
		"cmdk-group": "",
		role: "presentation",
		hidden: !d || void 0
	}, n && _.createElement("div", {
		ref: c,
		"cmdk-group-heading": "",
		"aria-hidden": !0,
		id: l
	}, n), $o(e, (e) => _.createElement("div", {
		"cmdk-group-items": "",
		role: "group",
		"aria-labelledby": n ? l : void 0
	}, _.createElement(No.Provider, { value: f }, e))));
}), Lo = _.forwardRef((e, t) => {
	let { alwaysRender: n, ...r } = e, i = _.useRef(null), a = Yo((e) => !e.search);
	return !n && !a ? null : _.createElement(hn.div, {
		ref: qt(i, t),
		...r,
		"cmdk-separator": "",
		role: "separator"
	});
}), Ro = _.forwardRef((e, t) => {
	let { onValueChange: n, ...r } = e, i = e.value != null, a = Mo(), o = Yo((e) => e.search), s = Yo((e) => e.selectedItemId), c = Ao();
	return _.useEffect(() => {
		e.value != null && a.setState("search", e.value);
	}, [e.value]), _.createElement(hn.input, {
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
}), zo = _.forwardRef((e, t) => {
	let { children: n, label: r = "Suggestions", ...i } = e, a = _.useRef(null), o = _.useRef(null), s = Yo((e) => e.selectedItemId), c = Ao();
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
	}, []), _.createElement(hn.div, {
		ref: qt(a, t),
		...i,
		"cmdk-list": "",
		role: "listbox",
		tabIndex: -1,
		"aria-activedescendant": s,
		"aria-label": r,
		id: c.listId
	}, $o(e, (e) => _.createElement("div", {
		ref: qt(o, c.listInnerRef),
		"cmdk-list-sizer": ""
	}, e)));
}), Bo = _.forwardRef((e, t) => {
	let { open: n, onOpenChange: r, overlayClassName: i, contentClassName: a, container: o, ...s } = e;
	return _.createElement(ga, {
		open: n,
		onOpenChange: r
	}, _.createElement(ba, { container: o }, _.createElement(Sa, {
		"cmdk-overlay": "",
		className: i
	}), _.createElement(Ea, {
		"aria-label": e.label,
		"cmdk-dialog": "",
		className: a
	}, _.createElement(Po, {
		ref: t,
		...s
	}))));
}), Vo = _.forwardRef((e, t) => Yo((e) => e.filtered.count === 0) ? _.createElement(hn.div, {
	ref: t,
	...e,
	"cmdk-empty": "",
	role: "presentation"
}) : null), Ho = _.forwardRef((e, t) => {
	let { progress: n, children: r, label: i = "Loading...", ...a } = e;
	return _.createElement(hn.div, {
		ref: t,
		...a,
		"cmdk-loading": "",
		role: "progressbar",
		"aria-valuenow": n,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-label": i
	}, $o(e, (e) => _.createElement("div", { "aria-hidden": !0 }, e)));
}), Uo = Object.assign(Po, {
	List: zo,
	Item: Fo,
	Input: Ro,
	Group: Io,
	Separator: Lo,
	Dialog: Bo,
	Empty: Vo,
	Loading: Ho
});
function Wo(e, t) {
	let n = e.nextElementSibling;
	for (; n;) {
		if (n.matches(t)) return n;
		n = n.nextElementSibling;
	}
}
function Go(e, t) {
	let n = e.previousElementSibling;
	for (; n;) {
		if (n.matches(t)) return n;
		n = n.previousElementSibling;
	}
}
function Ko(e) {
	let t = _.useRef(e);
	return qo(() => {
		t.current = e;
	}), t;
}
var qo = typeof window > "u" ? _.useEffect : _.useLayoutEffect;
function Jo(e) {
	let t = _.useRef();
	return t.current === void 0 && (t.current = e()), t;
}
function Yo(e) {
	let t = Mo(), n = () => e(t.snapshot());
	return _.useSyncExternalStore(t.subscribe, n, n);
}
function Xo(e, t, n, r = []) {
	let i = _.useRef(), a = Ao();
	return qo(() => {
		var o;
		let s = (() => {
			for (let e of n) {
				if (typeof e == "string") return e.trim();
				if (typeof e == "object" && "current" in e) return e.current ? e.current.textContent?.trim() : i.current;
			}
		})(), c = r.map((e) => e.trim());
		a.value(e, s, c), (o = t.current) == null || o.setAttribute(Do, s), i.current = s;
	}), i;
}
var Zo = () => {
	let [e, t] = _.useState(), n = Jo(() => /* @__PURE__ */ new Map());
	return qo(() => {
		n.current.forEach((e) => e()), n.current = /* @__PURE__ */ new Map();
	}, [e]), (e, r) => {
		n.current.set(e, r), t({});
	};
};
function Qo(e) {
	let t = e.type;
	return typeof t == "function" ? t(e.props) : "render" in t ? t.render(e.props) : e;
}
function $o({ asChild: e, children: t }, n) {
	return e && _.isValidElement(t) ? _.cloneElement(Qo(t), { ref: t.ref }, n(t.props.children)) : n(t);
}
var es = {
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
function ts(e) {
	let t = e.scrollHeight - e.clientHeight > 1, n = t && e.scrollTop > 1, r = t && e.scrollTop + e.clientHeight < e.scrollHeight - 1;
	return n && r ? "both" : n ? "top" : r ? "bottom" : "none";
}
//#endregion
//#region src/lib/searchScore.ts
var ns = 1, rs = .85, is = .7, as = .55, os = .45, ss = .2, cs = /[/\-_.]+/g;
function ls(e) {
	return e.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function us(e) {
	let t = ls(e).replace(cs, " ").trim().split(/\s+/u);
	return t[0] ? t : [];
}
function ds(e) {
	return ls(e).replace(cs, "").replace(/\s+/gu, "");
}
function fs(e, t) {
	let n = 0;
	for (let r of t) if (r === e[n] && (n += 1, n === e.length)) return !0;
	return !1;
}
function ps(e, t) {
	let n = e.length - t.length;
	if (Math.abs(n) > 1 || e === t) return n === 0 && e === t;
	let r = e, i = t;
	n > 0 && (r = t, i = e);
	let a = 0;
	for (; a < r.length && r[a] === i[a];) a += 1;
	return a === r.length ? i.length - r.length === 1 : r.length === i.length ? a + 1 < r.length && r[a] === i[a + 1] && r[a + 1] === i[a] && r.slice(a + 2) === i.slice(a + 2) || r.slice(a + 1) === i.slice(a + 1) : r.slice(a) === i.slice(a + 1);
}
function ms(e, t, n, r) {
	let i = 0;
	for (let n of t) {
		if (n === e) return ns;
		n.startsWith(e) && (i = Math.max(i, rs)), n.includes(e) && (i = Math.max(i, as)), e.length >= 4 && ps(e, n) && (i = Math.max(i, os)), e.length >= 3 && fs(e, n) && (i = Math.max(i, ss));
	}
	return (r === e || e.length >= 2 && r.startsWith(e)) && (i = Math.max(i, is)), n.includes(e) && (i = Math.max(i, as)), i;
}
function hs(e, t) {
	let n = us(t);
	if (n.length === 0) return 1;
	let r = us(e), i = ds(e), a = r.map((e) => e[0] ?? "").join(""), o = 0;
	for (let e of n) {
		let t = ms(e, r, i, a);
		if (t === 0) return 0;
		o += t;
	}
	return o;
}
function gs(e, t, n = []) {
	if (!t.trim()) return 1;
	let r = hs(e, t);
	for (let e of n) r = Math.max(r, hs(e, t));
	return n.length > 0 && (r = Math.max(r, hs(`${e} ${n.join(" ")}`, t))), r;
}
//#endregion
//#region src/components/ui/dialog.tsx
function _s({ ...e }) {
	return /* @__PURE__ */ (0, R.jsx)(ga, {
		"data-slot": "dialog",
		...e
	});
}
function vs({ ...e }) {
	return /* @__PURE__ */ (0, R.jsx)(ba, {
		"data-slot": "dialog-portal",
		...e
	});
}
function ys({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Sa, {
		"data-slot": "dialog-overlay",
		className: L("fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-overlay-in data-closed:animate-overlay-out motion-reduce:animate-none!", e),
		...t
	});
}
function bs({ className: e, children: t, showCloseButton: n = !0, container: r, ...i }) {
	return /* @__PURE__ */ (0, R.jsxs)(vs, {
		container: r,
		children: [/* @__PURE__ */ (0, R.jsx)(ys, {}), /* @__PURE__ */ (0, R.jsxs)(Ea, {
			"data-slot": "dialog-content",
			className: L("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm data-open:animate-dialog-in data-closed:animate-dialog-out motion-reduce:animate-none!", e),
			...i,
			children: [t, n && /* @__PURE__ */ (0, R.jsx)(Fa, {
				"data-slot": "dialog-close",
				asChild: !0,
				children: /* @__PURE__ */ (0, R.jsxs)(oo, {
					variant: "ghost",
					className: "absolute top-2 right-2",
					size: "icon-sm",
					children: [/* @__PURE__ */ (0, R.jsx)(j, {}), /* @__PURE__ */ (0, R.jsx)("span", {
						className: "sr-only",
						children: "Close"
					})]
				})
			})]
		})]
	});
}
function xs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "dialog-header",
		className: L("flex flex-col gap-2", e),
		...t
	});
}
function Ss({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(ja, {
		"data-slot": "dialog-title",
		className: L("font-heading text-base leading-none font-medium", e),
		...t
	});
}
function Cs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Na, {
		"data-slot": "dialog-description",
		className: L("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", e),
		...t
	});
}
//#endregion
//#region src/components/ui/input.tsx
function ws({ className: e, type: t, ...n }) {
	return /* @__PURE__ */ (0, R.jsx)("input", {
		type: t,
		"data-slot": "input",
		className: L("h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", e),
		...n
	});
}
//#endregion
//#region src/components/ui/textarea.tsx
function Ts({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("textarea", {
		"data-slot": "textarea",
		className: L("flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", e),
		...t
	});
}
//#endregion
//#region src/components/ui/input-group.tsx
function Es({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "input-group",
		role: "group",
		className: L("group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5", e),
		...t
	});
}
var Ds = pe("flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4", {
	variants: { align: {
		"inline-start": "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
		"inline-end": "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
		"block-start": "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
		"block-end": "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2"
	} },
	defaultVariants: { align: "inline-start" }
});
function Os({ className: e, align: t = "inline-start", ...n }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		role: "group",
		"data-slot": "input-group-addon",
		"data-align": t,
		className: L(Ds({ align: t }), e),
		onClick: (e) => {
			e.target.closest("button") || e.currentTarget.parentElement?.querySelector("input")?.focus();
		},
		...n
	});
}
function ks({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Ts, {
		"data-slot": "input-group-control",
		className: L("flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent", e),
		...t
	});
}
//#endregion
//#region src/components/ui/command.tsx
var As = 200, js = "cubic-bezier(0.16, 1, 0.3, 1)";
function Ms(e) {
	return !!e?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function Ns({ className: e, filter: t = gs, loop: n = !0, ...r }) {
	return /* @__PURE__ */ (0, R.jsx)(Uo, {
		"data-slot": "command",
		className: L("flex size-full min-h-0 flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground", e),
		filter: t,
		loop: n,
		...r
	});
}
function Ps({ children: e, commandRef: t, contentKey: n, contentRef: r, filter: i, title: a }) {
	let o = _.useRef(null), s = _.useRef(null), c = _.useRef(n), l = _.useRef(!1), u = l.current && c.current !== n;
	return c.current = n, l.current = !0, _.useLayoutEffect(() => {
		let e = r.current;
		if (!e) return;
		s.current?.cancel(), s.current = null;
		let t = e.offsetHeight, n = o.current;
		o.current = t;
		let i = e.ownerDocument.defaultView;
		if (n == null || n === t || Ms(i) || typeof e.animate != "function") return;
		let a = e.animate([{ height: `${n}px` }, { height: `${t}px` }], {
			duration: As,
			easing: js
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
	}, [r]), /* @__PURE__ */ (0, R.jsx)(Ns, {
		ref: t,
		className: u ? "animate-surface-in motion-reduce:animate-none!" : void 0,
		filter: i,
		label: a === "Accounts" ? "Search accounts" : "Search commands",
		tabIndex: -1,
		children: e
	}, n);
}
function Fs({ title: e = "Command Palette", description: t = "Search for a command to run...", children: n, className: r, showCloseButton: i = !1, container: a, contentKey: o, filter: s, onEscapeKeyDown: c, ...l }) {
	let u = _.useRef(null), d = _.useRef(null);
	return _.useLayoutEffect(() => {
		let e = u.current;
		o === void 0 || !e || e.querySelector("input, textarea, [contenteditable=true]") || e.focus();
	}, [o]), /* @__PURE__ */ (0, R.jsx)(_s, {
		...l,
		children: /* @__PURE__ */ (0, R.jsxs)(bs, {
			ref: d,
			className: L("top-1/3 left-1/2 -translate-x-1/2 translate-y-0 overflow-hidden rounded-xl! p-0", r),
			container: a,
			onEscapeKeyDown: c,
			onOpenAutoFocus: (e) => {
				e.preventDefault(), u.current?.querySelector("[data-slot=command-input], textarea, input")?.focus();
			},
			showCloseButton: i,
			children: [/* @__PURE__ */ (0, R.jsxs)(xs, {
				className: "sr-only",
				children: [/* @__PURE__ */ (0, R.jsx)(Ss, { children: e }), /* @__PURE__ */ (0, R.jsx)(Cs, { children: t })]
			}), /* @__PURE__ */ (0, R.jsx)(Ps, {
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
function Is({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "command-input-wrapper",
		className: "p-1 pb-0",
		children: /* @__PURE__ */ (0, R.jsxs)(Es, {
			className: "h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!",
			children: [/* @__PURE__ */ (0, R.jsx)(Uo.Input, {
				"data-slot": "command-input",
				className: L("w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50", e),
				...t
			}), /* @__PURE__ */ (0, R.jsx)(Os, { children: /* @__PURE__ */ (0, R.jsx)(ce, { className: "size-4 shrink-0 opacity-50" }) })]
		})
	});
}
function Ls({ className: e, onScroll: t, ...n }) {
	let r = _.useRef(null), [i, a] = _.useState("none"), o = _.useCallback(() => {
		let e = r.current;
		if (!e) return a("none");
		a(ts(e));
	}, []);
	return _.useLayoutEffect(() => {
		let e = r.current;
		if (!e || (o(), typeof ResizeObserver > "u")) return;
		let t = new ResizeObserver(o);
		t.observe(e);
		let n = e.querySelector("[cmdk-list-sizer]");
		return n && t.observe(n), () => t.disconnect();
	}, [o]), /* @__PURE__ */ (0, R.jsx)(Uo.List, {
		"data-slot": "command-list",
		"data-fade-mask": i,
		className: L("scroll-fade no-scrollbar max-h-80 min-h-0 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none", e),
		...n,
		ref: r,
		onScroll: (e) => {
			o(), t?.(e);
		}
	});
}
function Rs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Uo.Empty, {
		"data-slot": "command-empty",
		className: L("py-6 text-center text-sm", e),
		...t
	});
}
function zs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Uo.Group, {
		"data-slot": "command-group",
		className: L("overflow-x-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground", e),
		...t
	});
}
function Bs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Uo.Separator, {
		"data-slot": "command-separator",
		className: L("-mx-1 h-px bg-border", e),
		...t
	});
}
function Vs({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ (0, R.jsxs)(Uo.Item, {
		"data-slot": "command-item",
		className: L("group/command-item relative flex scroll-my-1 cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground", e),
		...n,
		children: [t, /* @__PURE__ */ (0, R.jsx)(ie, { className: "ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" })]
	});
}
//#endregion
//#region src/components/ui/label.tsx
function Hs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(Ra, {
		"data-slot": "label",
		className: L("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", e),
		...t
	});
}
//#endregion
//#region src/lib/caseIds.ts
var Us = /(?<!\d)\d{11}(?!\d)/g;
function Ws(e) {
	return [...new Set(e.match(Us) ?? [])];
}
var Gs = [
	"unfulfillable",
	"feedback",
	"stranded",
	"suppressed",
	"shippingQueue"
], Ks = [
	{
		id: "prepare",
		label: "Opening Seller Central"
	},
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
	},
	{
		id: "workbook",
		label: "Building spreadsheet"
	}
], qs = {
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
function Js(e) {
	return e === "unfulfillable" || e === "feedback" || e === "stranded" || e === "suppressed" || e === "shippingQueue";
}
function Ys(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return Js(t.source) ? t.status === "active" || t.status === "complete" || t.status === "error" : !1;
}
function Xs(e) {
	return !!(e && typeof e == "object" && e.type === "REPORTS_PROGRESS" && Ys(e));
}
function Zs(e, t) {
	let n = t.status === "error" ? "error" : t.status === "complete" ? "complete" : "active";
	return {
		...e,
		sources: {
			...e.sources,
			[t.source]: {
				status: n,
				loaded: t.loaded,
				total: t.total,
				phase: t.phase
			}
		}
	};
}
function Qs(e) {
	return Gs.every((t) => {
		let n = e.sources[t].status;
		return n === "complete" || n === "error";
	});
}
function $s(e, t) {
	return e.workbook === "complete" ? "complete" : Qs(e) && t ? "active" : e.workbook;
}
function ec(e) {
	return e.status === "complete" ? 100 : e.status === "error" ? null : e.source === "unfulfillable" ? tc(e) : e.source === "feedback" ? rc(e) : e.source === "suppressed" ? nc(e) : e.source === "shippingQueue" ? ic(e) : null;
}
function tc(e) {
	if (e.status === "complete") return 100;
	if (e.phase === "removal") {
		let t = e.total ?? 0;
		return t <= 0 ? 100 : 80 + Math.round(20 * Math.min(1, (e.loaded ?? 0) / t));
	}
	let t = e.total ?? 0;
	return t <= 0 ? e.loaded ? 80 : 0 : Math.round(80 * Math.min(1, (e.loaded ?? 0) / t));
}
function nc(e) {
	if (e.status === "complete") return 100;
	if (e.phase === "issues") {
		let t = e.total ?? 0;
		return t <= 0 ? 100 : 80 + Math.round(20 * Math.min(1, (e.loaded ?? 0) / t));
	}
	let t = e.total ?? 0;
	return t <= 0 ? e.loaded ? 80 : 0 : Math.round(80 * Math.min(1, (e.loaded ?? 0) / t));
}
function rc(e) {
	if (e.status === "complete") return 100;
	let t = e.total;
	return t == null || t <= 0 ? null : Math.round(100 * Math.min(1, (e.loaded ?? 0) / t));
}
function ic(e) {
	if (e.status === "complete") return 100;
	let t = e.total;
	return t == null || t <= 0 ? null : Math.round(100 * Math.min(1, (e.loaded ?? 0) / t));
}
function ac(e, t) {
	return t.status === "pending" ? "Waiting" : t.status === "complete" ? "Done" : t.status === "error" ? "Failed" : e === "unfulfillable" ? t.phase === "removal" ? t.total ? `Removal status ${t.loaded ?? 0} of ${t.total}` : "Checking removal status" : t.total ? `${t.loaded ?? 0} of ${t.total} listings` : t.loaded ? `${t.loaded} listings` : "Loading listings" : e === "feedback" ? t.total ? `Page ${t.loaded ?? 0} of ${t.total}` : t.loaded ? `Page ${t.loaded}` : "Loading" : e === "suppressed" ? t.phase === "issues" ? t.total ? `Suppression reasons ${t.loaded ?? 0} of ${t.total}` : "Loading suppression reasons" : t.total == null ? t.loaded ? `${t.loaded} listings` : "Loading listings" : `${t.loaded ?? 0} of ${t.total} listings` : e === "shippingQueue" ? t.phase === "details" ? t.total ? `Shipment details ${t.loaded ?? 0} of ${t.total}` : "Loading shipment details" : t.total == null ? t.loaded ? `${t.loaded} shipments` : "Loading shipments" : `${t.loaded ?? 0} of ${t.total} shipments` : "Loading";
}
//#endregion
//#region src/lib/settings.ts
var oc = [
	"open-case-ids",
	"open-shipment-ids",
	"search-skus",
	"time-out",
	"generate-reports",
	"accounts"
], sc = {
	"open-case-ids": !0,
	"open-shipment-ids": !0,
	"search-skus": !0,
	"time-out": !0,
	"generate-reports": !0,
	accounts: !0
}, cc = {
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
function lc(e, t) {
	return typeof e == "boolean" ? e : t;
}
function uc(e, t) {
	return typeof e == "string" ? e : t;
}
function dc(e) {
	let t = e && typeof e == "object" ? e : {}, n = t.features && typeof t.features == "object" ? t.features : {}, r = t.timeOutForm && typeof t.timeOutForm == "object" ? t.timeOutForm : {};
	return {
		features: {
			"open-case-ids": lc(n["open-case-ids"], !0),
			"open-shipment-ids": lc(n["open-shipment-ids"], !0),
			"search-skus": lc(n["search-skus"], !0),
			"time-out": lc(n["time-out"], !0),
			"generate-reports": lc(n["generate-reports"], !0),
			accounts: lc(n.accounts, !0)
		},
		timeOutForm: {
			staffName: uc(r.staffName, cc.staffName),
			business: uc(r.business, cc.business),
			supervisor: uc(r.supervisor, cc.supervisor),
			hoursWorked: uc(r.hoursWorked, cc.hoursWorked),
			scheduledAccountsCompleted: uc(r.scheduledAccountsCompleted, cc.scheduledAccountsCompleted),
			shortDailyUpdate: uc(r.shortDailyUpdate, cc.shortDailyUpdate),
			blockersOrRedFlags: uc(r.blockersOrRedFlags, cc.blockersOrRedFlags),
			clientAccountName: uc(r.clientAccountName, cc.clientAccountName),
			issueType: uc(r.issueType, cc.issueType),
			waitingOnWhom: uc(r.waitingOnWhom, cc.waitingOnWhom),
			followUpNeeded: uc(r.followUpNeeded, cc.followUpNeeded),
			escalatedToSupervisor: uc(r.escalatedToSupervisor, cc.escalatedToSupervisor),
			supervisorReviewNeeded: uc(r.supervisorReviewNeeded, cc.supervisorReviewNeeded),
			karenReviewNeeded: uc(r.karenReviewNeeded, cc.karenReviewNeeded)
		}
	};
}
function fc(e, t) {
	return !oc.includes(t) || e[t] !== !1;
}
function pc(e, t) {
	return oc.every((n) => e[n] === t[n]);
}
//#endregion
//#region src/lib/shipmentIds.ts
var mc = /(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi;
function hc(e) {
	return [...new Set((e.match(mc) ?? []).map((e) => e.toUpperCase()))];
}
//#endregion
//#region src/lib/skuIds.ts
var gc = 40;
function _c(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e.split(/[\n\r,\t]+/u)) {
		let e = r.trim();
		!e || e.length > gc || t.has(e) || (t.add(e), n.push(e));
	}
	return n;
}
//#endregion
//#region src/components/ui/item.tsx
function vc({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		role: "list",
		"data-slot": "item-group",
		className: L("group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2", e),
		...t
	});
}
var yc = pe("group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted", {
	variants: {
		variant: {
			default: "border-transparent",
			outline: "border-border",
			muted: "border-transparent bg-muted/50"
		},
		size: {
			default: "gap-2.5 px-3 py-2.5",
			sm: "gap-2.5 px-3 py-2.5",
			xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function bc({ className: e, variant: t = "default", size: n = "default", asChild: r = !1, ...i }) {
	let a = r ? $t : "div";
	return /* @__PURE__ */ (0, R.jsx)(a, {
		"data-slot": "item",
		"data-variant": t,
		"data-size": n,
		className: L(yc({
			variant: t,
			size: n,
			className: e
		})),
		...i
	});
}
var xc = pe("flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none", {
	variants: { variant: {
		default: "bg-transparent",
		icon: "[&_svg:not([class*='size-'])]:size-4",
		image: "size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover"
	} },
	defaultVariants: { variant: "default" }
});
function Sc({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "item-media",
		"data-variant": t,
		className: L(xc({
			variant: t,
			className: e
		})),
		...n
	});
}
function Cc({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "item-content",
		className: L("flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none", e),
		...t
	});
}
function wc({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("div", {
		"data-slot": "item-title",
		className: L("line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4", e),
		...t
	});
}
function Tc({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)("p", {
		"data-slot": "item-description",
		className: L("line-clamp-2 text-left text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary", e),
		...t
	});
}
//#endregion
//#region src/components/ui/progress.tsx
function Ec({ className: e, value: t, ...n }) {
	let r = t == null;
	return /* @__PURE__ */ (0, R.jsx)(ro, {
		"data-slot": "progress",
		"data-indeterminate": r || void 0,
		className: L("relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted", e),
		value: r ? null : t,
		...n,
		children: /* @__PURE__ */ (0, R.jsx)(io, {
			"data-slot": "progress-indicator",
			className: L("h-full bg-primary", r ? "absolute w-[35%]" : "size-full flex-1 transition-all"),
			style: r ? void 0 : { transform: `translateX(-${100 - (t || 0)}%)` }
		})
	});
}
//#endregion
//#region src/components/ui/spinner.tsx
function Dc({ className: e, ...t }) {
	return /* @__PURE__ */ (0, R.jsx)(A, {
		"data-slot": "spinner",
		role: "status",
		"aria-label": "Loading",
		className: L("size-4 animate-spin", e),
		...t
	});
}
//#endregion
//#region src/ReportProgressPanel.tsx
function Oc(e, t) {
	return e === "complete" ? /* @__PURE__ */ (0, R.jsx)(ie, {
		"aria-hidden": "true",
		className: "text-foreground"
	}) : e === "active" && !t ? /* @__PURE__ */ (0, R.jsx)(Dc, { className: "size-4" }) : /* @__PURE__ */ (0, R.jsx)(oe, {
		"aria-hidden": "true",
		className: L("size-4", e === "error" || e === "active" && t ? "text-foreground" : "text-muted-foreground/50")
	});
}
function kc(e, t) {
	return t.status === "pending" ? 0 : ec({
		source: e,
		status: t.status === "error" ? "error" : t.status === "complete" ? "complete" : "active",
		loaded: t.loaded,
		total: t.total,
		phase: t.phase
	});
}
function Ac(e, t, n) {
	if (n) return "Report generation failed.";
	if (e.prepare === "active") return "Opening Seller Central.";
	if ($s(e, t) === "active") return "Building spreadsheet.";
	let r = Gs.filter((t) => e.sources[t].status === "active").flatMap((e) => {
		let t = Ks.find((t) => t.id === e)?.label;
		return t ? [t] : [];
	});
	return r.length > 0 ? `${r.join(", ")}.` : "Generating report.";
}
function jc({ failed: e = !1, progress: t, submitting: n }) {
	let r = $s(t, n);
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "grid gap-2 px-2 py-2",
		children: [/* @__PURE__ */ (0, R.jsx)("p", {
			"aria-live": "polite",
			className: "sr-only",
			children: Ac(t, n, e)
		}), /* @__PURE__ */ (0, R.jsx)(vc, {
			className: "gap-1",
			children: Ks.map((e) => {
				if (e.id === "prepare") return /* @__PURE__ */ (0, R.jsx)(Mc, {
					current: t.prepare === "active",
					failed: !1,
					label: e.label,
					showBar: !1,
					status: t.prepare
				}, e.id);
				if (e.id === "workbook") return /* @__PURE__ */ (0, R.jsx)(Mc, {
					current: r === "active",
					failed: !1,
					label: e.label,
					showBar: !1,
					status: r
				}, e.id);
				let n = e.id, i = t.sources[n], a = kc(n, i);
				return /* @__PURE__ */ (0, R.jsx)(Mc, {
					current: i.status === "active",
					detail: ac(n, i),
					failed: i.status === "error",
					label: e.label,
					percent: a,
					showBar: !0,
					status: i.status
				}, e.id);
			})
		})]
	});
}
function Mc({ current: e, detail: t, failed: n, label: r, percent: i, showBar: a, status: o }) {
	let s = a && typeof i == "number" ? `${i}%` : null;
	return /* @__PURE__ */ (0, R.jsxs)(bc, {
		"aria-current": e ? "step" : void 0,
		className: "items-start px-2 py-1.5",
		role: "listitem",
		size: "sm",
		variant: e ? "muted" : "default",
		children: [/* @__PURE__ */ (0, R.jsx)(Sc, {
			variant: "icon",
			children: Oc(o, n)
		}), /* @__PURE__ */ (0, R.jsxs)(Cc, {
			className: "gap-1",
			children: [
				/* @__PURE__ */ (0, R.jsxs)("div", {
					className: "flex min-w-0 items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, R.jsx)(wc, {
						className: L(o === "pending" && "text-muted-foreground"),
						children: r
					}), s ? /* @__PURE__ */ (0, R.jsx)("span", {
						className: "text-xs tabular-nums text-muted-foreground",
						children: s
					}) : null]
				}),
				a ? /* @__PURE__ */ (0, R.jsx)(Ec, {
					"aria-label": r,
					value: o === "pending" || o === "error" ? 0 : i ?? null
				}) : null,
				t && o !== "pending" ? /* @__PURE__ */ (0, R.jsx)(Tc, {
					className: "text-xs",
					children: t
				}) : null
			]
		})]
	});
}
//#endregion
//#region src/CommandPalette.tsx
var Nc = 10, Pc = 50;
function Fc(e) {
	return e === "case-ids" || e === "shipment-ids" || e === "sku-ids";
}
function Ic(e, t) {
	return t.length === 1 ? `Open ${e} ${t[0]}` : `Open ${t.length} ${e} IDs`;
}
var Lc = {
	initialized: !1,
	unlocked: !1,
	stores: []
};
async function Rc() {
	return Lc;
}
var zc = [
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
				label: "Open Shipment IDs",
				icon: ue,
				keywords: [
					"shipment",
					"fba",
					"inbound",
					"transfer"
				]
			},
			{
				id: "search-skus",
				label: "Search SKU/s",
				icon: se,
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
				icon: D,
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
			icon: re,
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
function Bc({ container: e, open: t, initialMode: n, onOpenCaseIds: r, onOpenShipmentIds: i, onOpenSkuIds: a = async () => void 0, onGetAccountsStatus: o = Rc, onUnlockAccounts: s = async () => void 0, onStartAccountSwitch: c = async () => void 0, onFocusCurrentStore: l = async () => void 0, onFocusAccountSwitch: u = async () => void 0, onCancelAccountSwitch: d = async () => void 0, onManageAccounts: f = async () => void 0, onPrepareReports: p = async () => ({ loggedInToStore: !0 }), onGenerateReports: m = async () => void 0, onOpenTimeOut: h = async () => void 0, onOpenChange: g, enabledFeatures: v = sc }) {
	let [y, b] = _.useState(t && n && n !== "commands" ? n : "commands"), [x, S] = _.useState("case-ids"), [C, w] = _.useState(""), [T, ee] = _.useState(""), [te, E] = _.useState(""), [ne, ie] = _.useState([]), [oe, D] = _.useState(null), [O, A] = _.useState(!1), [ce, j] = _.useState(null), [M, de] = _.useState(qs), [N, fe] = _.useState([]), [pe, me] = _.useState(), [he, ge] = _.useState(null), [_e, ve] = _.useState(!1), [ye, be] = _.useState(!1), [xe, Se] = _.useState(null), [Ce, we] = _.useState(""), [Te, Ee] = _.useState("none"), De = _.useRef(null), Oe = _.useCallback(() => g(!1), [g]), ke = _.useMemo(() => ({
		"case-ids": {
			ariaLabel: "Case IDs",
			description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
			extractIds: Ws,
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
			extractIds: hc,
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
			extractIds: _c,
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
	]), Ae = ke[x], je = _.useMemo(() => zc.map((e) => ({
		...e,
		commands: e.commands.filter((e) => fc(v, e.id))
	})).filter((e) => e.commands.length > 0), [v]), Me = _.useMemo(() => Ae.extractIds(te), [te, Ae]), Ne = _.useMemo(() => Ws(C), [C]), Pe = _.useMemo(() => hc(C), [C]), Fe = C.trim(), Ie = fc(v, "accounts"), Le = _.useMemo(() => !Ie || !Fe ? [] : N.filter((e) => gs(e.name, Fe) > 0), [
		Ie,
		Fe,
		N
	]), Re = _.useMemo(() => !fc(v, "search-skus") || Ne.length > 0 || Pe.length > 0 || Le.length > 0 || Fe.length < 1 || Fe.length > 40 || /\s/u.test(Fe) ? !1 : !je.some((e) => e.commands.some((e) => gs(e.label, Fe, e.keywords) > 0)), [
		Ne.length,
		Pe.length,
		v,
		Le.length,
		Fe,
		je
	]);
	_.useEffect(() => {
		if (t) {
			n === "report-login" && b("report-login");
			return;
		}
		b("commands"), w(""), ee(""), E(""), ie([]), D(null), A(!1), j(null), de(qs), Se(null), we("");
	}, [n, t]), _.useEffect(() => {
		if (!t || !Ie) return;
		let e = !1;
		return o().then((t) => {
			e || (fe(t.stores), me(t.activeSwitch), ge(t.currentStore ?? null), ve(!0), be(t.unlocked));
		}).catch(() => {}), () => {
			e = !0;
		};
	}, [
		Ie,
		o,
		t
	]), _.useEffect(() => {
		Fc(y) && De.current?.focus();
	}, [y]);
	let ze = _.useCallback(() => {
		let e = De.current;
		if (!e) return Ee("none");
		Ee(ts(e));
	}, []);
	_.useLayoutEffect(() => {
		Fc(y) && ze();
	}, [
		te,
		y,
		ze
	]);
	let Be = _.useCallback(async (e, t = x) => {
		let n = ke[t];
		D(null), A(!0);
		try {
			await n.submit(e), Oe();
		} catch (e) {
			D(e instanceof Error ? e.message : `Couldn’t open ${n.noun} tabs. Please try again.`), A(!1);
		}
	}, [
		Oe,
		x,
		ke
	]), Ve = _.useCallback((e, t) => {
		if (!O) {
			if (S(e), t.length === 0) return D(ke[e].invalidError);
			if (t.length > Pc) return D(`Open no more than ${Pc} IDs at a time.`);
			if (t.length > Nc) {
				ie(t), D(null), b("confirm-ids");
				return;
			}
			Be(t, e);
		}
	}, [
		ke,
		Be,
		O
	]), He = _.useCallback(() => {
		Ve(x, Me);
	}, [
		Me,
		x,
		Ve
	]), Ue = _.useCallback(async () => {
		D(null), j("Loading accounts…"), A(!0);
		try {
			let e = await o();
			fe(e.stores), me(e.activeSwitch), ge(e.currentStore ?? null), ve(!0), be(e.unlocked), ee(""), b("accounts");
		} catch (e) {
			D(e instanceof Error ? e.message : "Couldn’t load accounts. Please try again.");
		} finally {
			A(!1);
		}
	}, [o]), We = _.useCallback(async (e) => {
		D(null), A(!0);
		try {
			if (he?.id === e.id) {
				await l(), Oe();
				return;
			}
			if (!ye) {
				Se(e), b("unlock"), A(!1);
				return;
			}
			await c(e.id), Oe();
		} catch (e) {
			D(e instanceof Error ? e.message : "Couldn’t start the account switch."), A(!1);
		}
	}, [
		ye,
		Oe,
		he,
		l,
		c
	]), Ge = _.useCallback(async () => {
		if (!(!xe || O)) {
			if (!Ce) return D("Enter your master password.");
			D(null), A(!0);
			try {
				await s(Ce), await c(xe.id), Oe();
			} catch (e) {
				D(e instanceof Error ? e.message : "Couldn’t unlock accounts."), A(!1);
			}
		}
	}, [
		Oe,
		Ce,
		c,
		s,
		xe,
		O
	]), Ke = _.useCallback(async () => {
		D(null), A(!0);
		try {
			await f(), Oe();
		} catch (e) {
			D(e instanceof Error ? e.message : "Couldn’t open account settings."), A(!1);
		}
	}, [Oe, f]), qe = _.useCallback(async () => {
		D(null), de({
			...qs,
			prepare: "active"
		}), b("generating-reports"), A(!0);
		try {
			let e = await p();
			if (!e.loggedInToStore) {
				if (A(!1), e.openedPromptOnSellerCentral) {
					Oe();
					return;
				}
				b("report-login");
				return;
			}
			de((e) => ({
				...e,
				prepare: "complete",
				sources: {
					unfulfillable: { status: "active" },
					feedback: { status: "active" },
					stranded: { status: "active" },
					suppressed: { status: "active" },
					shippingQueue: { status: "active" }
				}
			})), await m(_e ? he?.name ?? "" : void 0, (e) => de((t) => Zs(t, e))), Oe();
		} catch (e) {
			D(e instanceof Error ? e.message : "Couldn’t generate the report. Please try again."), A(!1);
		}
	}, [
		_e,
		Oe,
		he,
		m,
		p
	]), Je = _.useCallback(async () => {
		D(null), j("Opening Time Out…"), A(!0);
		try {
			await h(), Oe();
		} catch (e) {
			D(e instanceof Error ? e.message : "Couldn’t open Time Out. Please try again."), A(!1);
		}
	}, [Oe, h]), Ye = _.useCallback((e) => {
		if (e === "open-case-ids") {
			S("case-ids"), b("case-ids");
			return;
		}
		if (e === "open-shipment-ids") {
			S("shipment-ids"), b("shipment-ids");
			return;
		}
		if (e === "search-skus") {
			S("sku-ids"), b("sku-ids");
			return;
		}
		if (e === "generate-reports") {
			qe();
			return;
		}
		if (e === "time-out") {
			Je();
			return;
		}
		e === "accounts" && Ue();
	}, [
		qe,
		Ue,
		Je
	]), Xe = _.useCallback(async (e) => {
		D(null), A(!0);
		try {
			e === "focus" ? await u() : (await d(), me(void 0));
		} catch (e) {
			D(e instanceof Error ? e.message : "Couldn’t update the account switch.");
		} finally {
			A(!1);
		}
	}, [d, u]), Ze = _.useCallback(() => {
		b("commands"), D(null), de(qs);
	}, []), Qe = _.useCallback((e) => {
		g(e);
	}, [g]), $e = _.useCallback((e) => {
		if (e.preventDefault(), !O) {
			if (D(null), y === "commands") return C ? w("") : g(!1);
			if (Fc(y)) return te ? E("") : b("commands");
			if (y === "confirm-ids") return b(x);
			if (y === "report-login" || y === "generating-reports") return b("commands");
			if (y === "unlock") return Ce ? we("") : b("accounts");
			if (T) return ee("");
			b("commands");
		}
	}, [
		T,
		C,
		te,
		x,
		Ce,
		y,
		g,
		O
	]), et = y === "commands" ? "Command Palette" : y === "accounts" ? "Accounts" : y === "unlock" ? "Unlock Accounts" : y === "confirm-ids" ? "Confirm Bulk Open" : y === "report-login" || y === "generating-reports" ? "Generate Reports" : Ae.title, tt = y === "commands" ? "Search for a command to run." : y === "accounts" ? "Search stores or manage account switching." : y === "unlock" ? `Unlock to switch to ${xe?.name ?? "the selected store"}.` : y === "report-login" ? "Sign in to a Seller Central store to generate reports." : y === "generating-reports" ? "Generating the Seller Central report." : Ae.description, nt = (e = "Back", t = Ze) => /* @__PURE__ */ (0, R.jsx)("div", {
		className: "p-1 pb-0",
		children: /* @__PURE__ */ (0, R.jsxs)(oo, {
			className: "active:not-aria-[haspopup]:translate-y-0",
			disabled: O,
			onClick: t,
			onPointerDown: (e) => {
				e.button === 0 && (e.preventDefault(), t());
			},
			size: "sm",
			type: "button",
			variant: "ghost",
			children: [/* @__PURE__ */ (0, R.jsx)(ae, { "aria-hidden": "true" }), e]
		})
	}), P = (e) => oe ? /* @__PURE__ */ (0, R.jsx)(Vt, {
		className: "mx-1 mb-1",
		id: e,
		variant: "destructive",
		children: /* @__PURE__ */ (0, R.jsx)(Ut, { children: oe })
	}) : null;
	return /* @__PURE__ */ (0, R.jsx)("div", {
		className: "palette-scope",
		children: /* @__PURE__ */ (0, R.jsx)(Fs, {
			container: e,
			contentKey: y,
			description: tt,
			open: t,
			onEscapeKeyDown: $e,
			onOpenChange: Qe,
			title: et,
			children: y === "commands" ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				/* @__PURE__ */ (0, R.jsx)(Is, {
					autoFocus: !0,
					"aria-label": "Search commands",
					disabled: O,
					onValueChange: (e) => {
						w(e), D(null);
					},
					placeholder: "Type a command or store...",
					value: C
				}),
				O && ce ? /* @__PURE__ */ (0, R.jsx)("p", {
					"aria-live": "polite",
					className: "px-2 py-1.5 text-sm text-muted-foreground",
					children: ce
				}) : null,
				/* @__PURE__ */ (0, R.jsxs)(Ls, {
					"aria-label": "Commands",
					children: [
						Ne.length > 0 || Pe.length > 0 || Re || Le.length > 0 ? null : /* @__PURE__ */ (0, R.jsx)(Rs, { children: "No results found." }),
						Ne.length > 0 || Pe.length > 0 ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [/* @__PURE__ */ (0, R.jsxs)(zs, {
							forceMount: !0,
							heading: "Detected",
							children: [Ne.length > 0 ? /* @__PURE__ */ (0, R.jsxs)(Vs, {
								disabled: O,
								forceMount: !0,
								keywords: Ne,
								onSelect: () => Ve("case-ids", Ne),
								value: Ic("case", Ne),
								children: [/* @__PURE__ */ (0, R.jsx)(k, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: Ic("case", Ne)
								})]
							}) : null, Pe.length > 0 ? /* @__PURE__ */ (0, R.jsxs)(Vs, {
								disabled: O,
								forceMount: !0,
								keywords: Pe,
								onSelect: () => Ve("shipment-ids", Pe),
								value: Ic("shipment", Pe),
								children: [/* @__PURE__ */ (0, R.jsx)(ue, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: Ic("shipment", Pe)
								})]
							}) : null]
						}), /* @__PURE__ */ (0, R.jsx)(Bs, { alwaysRender: !0 })] }) : null,
						Le.length > 0 ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [/* @__PURE__ */ (0, R.jsx)(zs, {
							forceMount: !0,
							heading: "Stores",
							children: Le.map((e) => /* @__PURE__ */ (0, R.jsxs)(Vs, {
								"data-checked": he?.id === e.id || void 0,
								disabled: O,
								forceMount: !0,
								keywords: [e.name],
								onSelect: () => void We(e),
								value: `Switch to ${e.name}`,
								children: [/* @__PURE__ */ (0, R.jsx)(re, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: e.name
								})]
							}, e.id))
						}), /* @__PURE__ */ (0, R.jsx)(Bs, { alwaysRender: !0 })] }) : null,
						Re ? /* @__PURE__ */ (0, R.jsx)(zs, {
							forceMount: !0,
							heading: "Search",
							children: /* @__PURE__ */ (0, R.jsxs)(Vs, {
								disabled: O,
								forceMount: !0,
								keywords: [Fe],
								onSelect: () => Ve("sku-ids", [Fe]),
								value: `Search '${Fe}' as SKU`,
								children: [/* @__PURE__ */ (0, R.jsx)(se, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsxs)("span", {
									className: "min-w-0 flex-1 truncate",
									children: [
										"Search '",
										Fe,
										"' as SKU"
									]
								})]
							})
						}) : null,
						je.map((e, t) => /* @__PURE__ */ (0, R.jsxs)(_.Fragment, { children: [t ? /* @__PURE__ */ (0, R.jsx)(Bs, {}) : null, /* @__PURE__ */ (0, R.jsx)(zs, {
							heading: e.heading,
							children: e.commands.map((e) => {
								let t = e.icon;
								return /* @__PURE__ */ (0, R.jsxs)(Vs, {
									value: e.label,
									keywords: [...e.keywords],
									disabled: O,
									onSelect: () => Ye(e.id),
									children: [/* @__PURE__ */ (0, R.jsx)(t, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: e.label
									})]
								}, e.id);
							})
						})] }, e.heading))
					]
				}),
				P()
			] }) : y === "accounts" ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				nt(),
				pe ? /* @__PURE__ */ (0, R.jsxs)(Vt, {
					className: "mx-1 my-1",
					role: "status",
					children: [
						/* @__PURE__ */ (0, R.jsxs)(Ht, { children: ["Switching to ", pe.storeName] }),
						/* @__PURE__ */ (0, R.jsxs)(Ut, { children: ["Stage: ", pe.stage] }),
						/* @__PURE__ */ (0, R.jsxs)("div", {
							className: "mt-2 flex gap-2",
							children: [/* @__PURE__ */ (0, R.jsx)(oo, {
								disabled: O,
								onClick: () => void Xe("focus"),
								size: "xs",
								type: "button",
								variant: "outline",
								children: "Go to login"
							}), /* @__PURE__ */ (0, R.jsx)(oo, {
								disabled: O,
								onClick: () => void Xe("cancel"),
								size: "xs",
								type: "button",
								variant: "destructive",
								children: "Cancel switch"
							})]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, R.jsxs)("p", {
					"aria-label": `Current store: ${he?.name ?? "Unknown"}`,
					className: "px-2 py-1.5 text-xs font-medium text-muted-foreground",
					role: "status",
					children: ["Current store: ", he?.name ?? "Unknown"]
				}),
				/* @__PURE__ */ (0, R.jsx)(Is, {
					autoFocus: !0,
					"aria-label": "Search accounts",
					disabled: O,
					onValueChange: (e) => {
						ee(e), D(null);
					},
					placeholder: "Search stores...",
					value: T
				}),
				/* @__PURE__ */ (0, R.jsxs)(Ls, {
					"aria-label": "Accounts",
					children: [
						/* @__PURE__ */ (0, R.jsx)(Rs, { children: "No matching stores." }),
						/* @__PURE__ */ (0, R.jsxs)(zs, {
							heading: "Stores",
							children: [N.map((e) => /* @__PURE__ */ (0, R.jsxs)(Vs, {
								"data-checked": he?.id === e.id || void 0,
								disabled: O,
								onSelect: () => void We(e),
								value: e.name,
								children: [/* @__PURE__ */ (0, R.jsx)(re, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: e.name
								})]
							}, e.id)), N.length === 0 ? /* @__PURE__ */ (0, R.jsx)("div", {
								className: "py-6 text-center text-sm text-muted-foreground",
								children: "No stores configured."
							}) : null]
						}),
						/* @__PURE__ */ (0, R.jsx)(Bs, {}),
						/* @__PURE__ */ (0, R.jsx)(zs, {
							heading: "Configuration",
							children: /* @__PURE__ */ (0, R.jsxs)(Vs, {
								value: "Manage Accounts",
								disabled: O,
								onSelect: () => void Ke(),
								children: [/* @__PURE__ */ (0, R.jsx)(le, { "aria-hidden": "true" }), /* @__PURE__ */ (0, R.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: "Manage Accounts"
								})]
							})
						})
					]
				}),
				P()
			] }) : y === "unlock" ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				nt("Accounts", () => {
					b("accounts"), D(null);
				}),
				/* @__PURE__ */ (0, R.jsxs)("form", {
					autoComplete: "off",
					className: "grid gap-4 px-2 pb-2",
					onSubmit: (e) => e.preventDefault(),
					children: [
						/* @__PURE__ */ (0, R.jsxs)("p", {
							className: "text-sm text-foreground",
							children: [
								"Unlock to switch to ",
								xe?.name,
								"."
							]
						}),
						/* @__PURE__ */ (0, R.jsxs)("div", {
							className: "grid gap-2",
							children: [/* @__PURE__ */ (0, R.jsx)(Hs, {
								htmlFor: "s4e-spotlight-vault-unlock",
								children: "Master password"
							}), /* @__PURE__ */ (0, R.jsx)(ws, {
								autoFocus: !0,
								"aria-describedby": oe ? "unlock-error" : void 0,
								"aria-invalid": !!oe,
								autoComplete: "new-password",
								"data-1p-ignore": "true",
								"data-lpignore": "true",
								"data-bwignore": "true",
								"data-form-type": "other",
								disabled: O,
								id: "s4e-spotlight-vault-unlock",
								name: "s4e-spotlight-vault-unlock",
								type: "password",
								value: Ce,
								onChange: (e) => {
									we(e.target.value), D(null);
								},
								onKeyDown: (e) => {
									e.key === "Enter" && (e.preventDefault(), Ge());
								}
							})]
						}),
						/* @__PURE__ */ (0, R.jsx)(oo, {
							className: "w-full",
							disabled: O,
							onClick: () => void Ge(),
							type: "button",
							children: O ? "Unlocking…" : "Unlock and switch"
						})
					]
				}),
				P("unlock-error")
			] }) : y === "confirm-ids" ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				nt("Back", () => {
					b(x), D(null);
				}),
				/* @__PURE__ */ (0, R.jsxs)(Vt, {
					className: "mx-1 mb-1",
					role: "status",
					children: [/* @__PURE__ */ (0, R.jsxs)(Ht, { children: [
						"Open ",
						ne.length,
						" ",
						Ae.noun,
						" tabs in the background?"
					] }), /* @__PURE__ */ (0, R.jsx)(Ut, { children: "This may briefly use significant browser resources." })]
				}),
				/* @__PURE__ */ (0, R.jsxs)("div", {
					className: "flex gap-2 px-1 pb-1",
					children: [/* @__PURE__ */ (0, R.jsx)(oo, {
						className: "flex-1",
						disabled: O,
						onClick: () => b(x),
						type: "button",
						variant: "outline",
						children: "Cancel"
					}), /* @__PURE__ */ (0, R.jsx)(oo, {
						autoFocus: !0,
						className: "flex-1",
						disabled: O,
						onClick: () => void Be(ne),
						type: "button",
						children: O ? "Opening…" : `Open ${ne.length} tabs`
					})]
				}),
				P()
			] }) : y === "generating-reports" ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				oe ? nt() : null,
				/* @__PURE__ */ (0, R.jsx)(jc, {
					failed: !!oe,
					progress: M,
					submitting: O
				}),
				P()
			] }) : y === "report-login" ? /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				nt(),
				/* @__PURE__ */ (0, R.jsxs)(Vt, {
					className: "mx-1 mb-1",
					children: [/* @__PURE__ */ (0, R.jsx)(Ht, { children: "Sign in to a Seller Central store" }), /* @__PURE__ */ (0, R.jsx)(Ut, { children: "Generate Reports needs an open Seller Central store. Sign in with Accounts, then try again." })]
				}),
				/* @__PURE__ */ (0, R.jsxs)("div", {
					className: "flex gap-2 px-1 pb-1",
					children: [/* @__PURE__ */ (0, R.jsx)(oo, {
						className: "flex-1",
						disabled: O,
						onClick: Ze,
						type: "button",
						variant: "outline",
						children: "Cancel"
					}), /* @__PURE__ */ (0, R.jsx)(oo, {
						autoFocus: !0,
						className: "flex-1",
						disabled: O,
						onClick: () => void Ue(),
						type: "button",
						children: O ? "Loading…" : "Open Accounts"
					})]
				}),
				P()
			] }) : /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
				nt(),
				/* @__PURE__ */ (0, R.jsx)("div", {
					className: "p-1 pb-0",
					children: /* @__PURE__ */ (0, R.jsx)(Es, {
						className: "h-auto rounded-lg! border-input/30 bg-input/30 shadow-none!",
						children: /* @__PURE__ */ (0, R.jsx)(ks, {
							ref: De,
							"aria-describedby": oe ? "identifier-input-error" : "identifier-input-count",
							"aria-invalid": !!oe,
							"aria-label": Ae.ariaLabel,
							className: "identifier-input scroll-fade no-scrollbar min-h-32",
							"data-fade-mask": Te,
							disabled: O,
							placeholder: Ae.placeholder,
							value: te,
							onChange: (e) => {
								E(e.target.value), D(null);
							},
							onScroll: ze,
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									if (e.shiftKey || e.nativeEvent.isComposing) {
										e.stopPropagation();
										return;
									}
									e.preventDefault(), e.stopPropagation(), He();
								}
							}
						})
					})
				}),
				/* @__PURE__ */ (0, R.jsxs)("div", {
					className: "flex items-center justify-between gap-2 px-2 py-1",
					children: [/* @__PURE__ */ (0, R.jsxs)("p", {
						id: "identifier-input-count",
						"aria-live": "polite",
						className: "m-0 text-xs text-muted-foreground",
						children: [
							Me.length,
							" unique ",
							Ae.unit,
							Me.length === 1 ? "" : "s"
						]
					}), /* @__PURE__ */ (0, R.jsx)(oo, {
						disabled: O || Me.length === 0,
						onClick: He,
						size: "sm",
						type: "button",
						children: O ? "Opening…" : "Open"
					})]
				}),
				P("identifier-input-error")
			] })
		})
	});
}
//#endregion
//#region src/lib/colorScheme.ts
function Vc(e, t = window) {
	let n = t.matchMedia?.("(prefers-color-scheme: dark)");
	if (!n) return () => void 0;
	let r = () => e.classList.toggle("dark", n.matches);
	return r(), n.addEventListener("change", r), () => n.removeEventListener("change", r);
}
var Hc = [
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
], Uc = [
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
], Wc = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: " "
};
function Gc(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 1 && e <= 3;
}
function Kc(e) {
	return Gc(e) ? e <= 2 ? "Negative" : "Neutral" : "";
}
function qc(e) {
	return e.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (e, t) => {
		if (t.startsWith("#x") || t.startsWith("#X")) {
			let n = Number.parseInt(t.slice(2), 16);
			return Number.isFinite(n) ? String.fromCodePoint(n) : e;
		}
		if (t.startsWith("#")) {
			let n = Number.parseInt(t.slice(1), 10);
			return Number.isFinite(n) ? String.fromCodePoint(n) : e;
		}
		return Wc[t] ?? e;
	});
}
function Jc(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : `${String(t.getUTCDate()).padStart(2, "0")}-${Uc[t.getUTCMonth()]}-${t.getUTCFullYear()} ${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}:${String(t.getUTCSeconds()).padStart(2, "0")}`;
}
function Yc(e) {
	return e == null ? "" : String(e);
}
function Xc(e) {
	return e === !0 ? "Yes" : e === !1 ? "No" : "";
}
function Zc(e) {
	return Xc(e.answerMap?.ItemAsDescribed?.booleanRating);
}
function Qc(e) {
	let t = typeof e.numericRating == "number" && Number.isFinite(e.numericRating) ? e.numericRating : "";
	return [
		Jc(e.feedbackDate),
		t,
		Kc(typeof t == "number" ? t : void 0),
		Yc(e.orderId),
		qc(e.feedbackText ?? ""),
		Zc(e),
		qc(e.responseText ?? ""),
		Jc(e.responseDate),
		Xc(e.suppressed),
		Xc(e.partiallySuppressed),
		Yc(e.suppressReasonId),
		Yc(e.feedbackId)
	];
}
function $c(e) {
	return [[...Hc], ...e.map(Qc)];
}
//#endregion
//#region src/lib/dailyTasks.ts
var el = [
	"Feedback Manager",
	"Disposal Orders",
	"Open Cases"
];
function tl(e = []) {
	return [
		[el[0]],
		...$c(e),
		[],
		[el[1]],
		[],
		[el[2]]
	];
}
//#endregion
//#region src/lib/shippingQueue.ts
var nl = "https://sellercentral.amazon.com/fba/wmsr", rl = "Loaded", il = "Couldn’t load shipment details", al = "Some shipments could not be loaded. This sheet includes only the shipments that were obtainable.", ol = "Shipment details could not be loaded for some shipments. Those rows are marked “Couldn’t load shipment details”.", sl = "Some shipments have more SKU lines than Amazon returned in one response. Those shipments list only the SKU lines that were obtainable.", cl = /* @__PURE__ */ "Shipment Name.Shipment ID.Shipment URL.Status.Destination FC.FC Country.Ship From Address ID.Created Date.Last Updated Date.MSKUs.Shipped Quantity.Received Quantity.Expected Quantity.Located Quantity.Stowed Quantity.Quantity Discrepancy.Workflow ID.Workflow Type.PO ID.Placement Status.Window Type.Window Start Date.Window End Date.Grace Period End Date.Window Compliance Status.Need By Date.Reason Code.Finalized.Finalized Date.Estimated Finalized Date UTC.Former Estimated Finalized Date UTC.Blocked.Partnered Import.Merchant Launched.ISMS Details.T2P Accelerate".split("."), ll = [
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
], ul = /* @__PURE__ */ "SKU.Title.FNSKU.ASIN.ASIN URL.UPC.Barcode Type.Barcode Value.Condition.Sortable.Eligible For Research.Item Expected Quantity.Item Located Quantity.Item Received Quantity.Adjustment Quantity.Reimbursed Quantity.Clawback Quantity.Acknowledged Quantity.Denied Quantity.Virtually Adjusted Quantity.Other Received Quantity.Other Receive Start Date.Other Receive End Date.IAR Auto Reconciliations.Item Discrepancy Quantity.Item Ineligibility Reason.Item Case ID.Item Reason Code".split("."), dl = [
	...cl,
	...ll,
	...ul
], fl = [
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
function pl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e), n = Number.isFinite(t) ? new Date(t) : new Date(String(e));
	return Number.isNaN(n.getTime()) ? String(e) : `${String(n.getUTCDate()).padStart(2, "0")}-${fl[n.getUTCMonth()]}-${n.getUTCFullYear()} ${String(n.getUTCHours()).padStart(2, "0")}:${String(n.getUTCMinutes()).padStart(2, "0")}:${String(n.getUTCSeconds()).padStart(2, "0")}`;
}
function ml(e) {
	return e === 0 || e === "0" ? "" : pl(e);
}
function U(e) {
	return e == null ? "" : String(e);
}
function hl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : "";
}
function gl(e) {
	return e === !0 ? "Yes" : e === !1 ? "No" : "";
}
function _l(e, t) {
	let n = hl(e), r = hl(t);
	return n === "" || r === "" ? "" : n - r;
}
function vl(e) {
	let t = e?.trim();
	return t ? `https://sellercentral.amazon.com/fba/inbound-shipment/summary/${encodeURIComponent(t)}/contents` : "";
}
function yl(e) {
	let t = e?.trim();
	return t ? `${nl}/${encodeURIComponent(t)}` : "";
}
function bl(e) {
	let t = e?.trim();
	return t ? `https://www.amazon.com/dp/${encodeURIComponent(t)}` : "";
}
function xl(e) {
	if (e == null) return "";
	if (typeof e == "boolean") return gl(e);
	if (typeof e == "object") try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
	return String(e);
}
function Sl(e) {
	return e ? Object.entries(e).map(([e, t]) => `${e}: ${xl(t)}`).join("; ") : "";
}
function Cl(e) {
	let t = e?.discrepancyTotalRecords;
	return typeof t == "number" && t > (e?.items.length ?? 0);
}
function wl(e) {
	let t = 0, n = !1;
	for (let r of e.items) typeof r.totalDiscrepancyQuantity == "number" && (t += r.totalDiscrepancyQuantity, n = !0);
	return n ? t : "";
}
var Tl = ll.map(() => ""), El = ul.map(() => "");
function Dl(e) {
	let t = e.shipOrDeliveryWindow;
	return [
		U(e.shipmentName),
		U(e.shipmentId),
		vl(e.shipmentId),
		U(e.shipmentStatus),
		U(e.destinationFC),
		U(e.fcAddress),
		U(e.shipFromAddressId),
		pl(e.createdDate),
		pl(e.lastUpdatedDate),
		hl(e.mskus),
		hl(e.shippedQuantity),
		hl(e.receivedQuantity),
		hl(e.expectedQuantity),
		hl(e.locatedQuantity),
		hl(e.stowedQuantity),
		_l(e.receivedQuantity, e.shippedQuantity),
		U(e.workflowId),
		U(e.workflowType),
		U(e.poId),
		U(e.placementStatus),
		U(t?.windowType),
		pl(t?.windowStartDate),
		pl(t?.windowEndDate),
		pl(t?.gracePeriodEndDate),
		U(e.shipOrDeliveryWindowComplianceStatus),
		pl(e.needByDate),
		U(e.reasonCode),
		gl(e.finalized),
		pl(e.finalizedDate),
		pl(e.estimatedFinalizedDateUTC),
		pl(e.formerEstimatedFinalizedDateUTC),
		gl(e.blocked),
		gl(e.partneredImport),
		gl(e.merchantLaunched),
		xl(e.ismsDetails),
		xl(e.t2pAccelerate)
	];
}
function Ol(e) {
	let t = e.details;
	if (!t) return [e.detailsFetchFailed ? il : "", ...Tl.slice(1)];
	let n = t.inquiry;
	return [
		rl,
		yl(e.shipmentId),
		gl(t.eligible),
		U(t.ineligibilityReason),
		ml(t.estimatedTimestamp),
		ml(t.formerEstimatedTimestamp),
		hl(t.daysToWait),
		Sl(t.details),
		U(n?.inquiryStatus),
		U(n?.inquiryText),
		U(n?.caseId),
		pl(n?.caseCreationDate),
		U(n?.caseCreatedBy),
		gl(t.hasDiscrepancy),
		U(t.retailDomainName),
		gl(t.wmsrAllowed),
		hl(t.discrepancyTotalRecords ?? t.items.length),
		wl(t)
	];
}
function kl(e) {
	return e ? [
		U(e.merchantSKU),
		U(e.title),
		U(e.fnsku),
		U(e.asin),
		bl(e.asin),
		U(e.upc),
		U(e.barcodeType),
		U(e.barcodeValue),
		U(e.itemCondition),
		gl(e.isSortable),
		gl(e.eligibleForResearch),
		hl(e.expectedQuantity),
		hl(e.totalLocatedQuantity),
		hl(e.totalReceivedQuantity),
		hl(e.totalAdjustmentQuantity),
		hl(e.totalReimbursedQuantity),
		hl(e.totalClawbackQuantity),
		hl(e.totalAcknowledgedQuantity),
		hl(e.totalDeniedQuantity),
		hl(e.totalVirtuallyAdjustedQuantity),
		hl(e.otherReceivedQuantity),
		pl(e.otherReceiveStartDate),
		pl(e.otherReceiveEndDate),
		xl(e.iarAutoReconciliations),
		hl(e.totalDiscrepancyQuantity),
		U(e.ineligibilityReason),
		U(e.caseId),
		U(e.reasonCode)
	] : [...El];
}
function Al(e, t) {
	return [
		...Dl(e),
		...Ol(e),
		...kl(t)
	];
}
function jl(e) {
	let t = e.details?.items ?? [];
	return t.length === 0 ? [Al(e)] : t.map((t) => Al(e, t));
}
function Ml(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([al]), e.some((e) => e.detailsFetchFailed) && t.push([ol]), e.some((e) => Cl(e.details)) && t.push([sl]), t.length && t.push([]), t;
}
function Nl(e) {
	return [
		...Ml(e),
		[...dl],
		...e.flatMap(jl)
	];
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
function Bl(e) {
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
function W(e) {
	return e ? Il[e] ?? e : "";
}
function G(e) {
	return e ? e.split("#").map((e) => e.trim()).filter(Boolean).join(", ") : "";
}
function K(e) {
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
		Bl(e.DateAutoRemoval),
		W(e.AutoRemovalType),
		Bl(e.DateStranded),
		Ll(e.StrandedReasonLabel || e.ErrorMessage || e.StrandedReasonCode || e.StrandedReason),
		Ll(e.StrandedReasonCode || e.StrandedReason),
		Ll(e.ErrorMessage),
		Ll(e.FulfilledBy),
		Ll(e.Program),
		G(e.SupportedActions)
	];
}
function q(e) {
	return [[...Fl], ...e.map(K)];
}
//#endregion
//#region src/lib/unfulfillable.ts
var J = [
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
], Vl = "query GetListingsV2($pagination: PaginationInput, $usecase: UsecaseInput!, $sortRequest: SortRequest!, $searchTerm: SearchTerm, $multiSelectFilters: [MultiSelectFilter!], $multiSKUList: [String!]) {\n  listingsV2(\n    usecase: $usecase\n    pagination: $pagination\n    sortRequest: $sortRequest\n    searchTerm: $searchTerm\n    multiSelectFilters: $multiSelectFilters\n    multiSKUList: $multiSKUList\n  ) {\n    listings {\n      coreListingFields {\n        sku\n        asin\n        fnSku\n        __typename\n      }\n      listingData {\n        title\n        lastUpdated\n        __typename\n      }\n      imageUrl\n      status {\n        status\n        __typename\n      }\n      availability {\n        unfulfillable\n        unfulfillableDetails {\n          expired\n          damagedByCarrier\n          damagedByCustomer\n          damagedByDistributor\n          damagedByWarehouse\n          defective\n          __typename\n        }\n        __typename\n      }\n      offers {\n        offerId\n        price {\n          price {\n            amount\n            currencyUnit\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    count";
`${Vl}`, `${Vl}`;
var Hl = "Total available for removal", Ul = "unknown ineligible reason", Wl = "Couldn’t load removal status", Gl = "Some unfulfillable listings could not be loaded. This sheet includes only the listings that were obtainable.", Kl = `Removal status could not be loaded for some SKUs. Those rows are marked “${Wl}”.`, ql = {
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
		[...J],
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
function Fu(e) {
	return e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;");
}
function Iu(e) {
	let t = "", n = e + 1;
	for (; n > 0;) {
		let e = (n - 1) % 26;
		t = String.fromCharCode(65 + e) + t, n = Math.floor((n - 1) / 26);
	}
	return t;
}
function Lu(e, t) {
	return typeof t == "number" && Number.isFinite(t) ? `<c r="${e}"><v>${String(t)}</v></c>` : `<c r="${e}" t="inlineStr"><is><t>${Fu(String(t))}</t></is></c>`;
}
function Ru(e = []) {
	return e.length === 0 ? "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData/></worksheet>" : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${e.map((e, t) => {
		let n = t + 1;
		return `<row r="${n}">${e.map((e, t) => Lu(`${Iu(t)}${n}`, e)).join("")}</row>`;
	}).join("")}</sheetData></worksheet>`;
}
function zu(e) {
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
function Bu(e) {
	if (e.length === 0) throw Error("A workbook needs at least one worksheet.");
	let t = e.map((e, t) => {
		let n = t + 1;
		return {
			id: n,
			name: e.name,
			path: `xl/worksheets/sheet${n}.xml`,
			relId: `rId${n}`,
			xml: Ru(e.rows)
		};
	}), n = [
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
		"<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
		"<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
		"<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
		"<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>",
		...t.map((e) => `<Override PartName="/${e.path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`),
		"</Types>"
	].join(""), r = [
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
		"<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
		"<sheets>",
		...t.map((e) => `<sheet name="${Fu(e.name)}" sheetId="${e.id}" r:id="${e.relId}"/>`),
		"</sheets>",
		"</workbook>"
	].join(""), i = [
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
		"<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
		...t.map((e) => `<Relationship Id="${e.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${e.id}.xml"/>`),
		"</Relationships>"
	].join("");
	return zu([
		{
			name: "[Content_Types].xml",
			data: Pu(n)
		},
		{
			name: "_rels/.rels",
			data: Pu("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>")
		},
		{
			name: "xl/workbook.xml",
			data: Pu(r)
		},
		{
			name: "xl/_rels/workbook.xml.rels",
			data: Pu(i)
		},
		...t.map((e) => ({
			name: e.path,
			data: Pu(e.xml)
		}))
	]);
}
//#endregion
//#region src/lib/reports.ts
var Vu = [
	"Daily Tasks",
	"Unfulfillable",
	"Stranded",
	"Suppressed",
	"Shipping Queue"
], Hu = [
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
], Uu = /[/\\:*?"<>|]/g;
function Wu(e) {
	return `${String(e.getDate()).padStart(2, "0")}-${Hu[e.getMonth()]}-${e.getFullYear()}`;
}
function Z(e) {
	return e.replace(Uu, " ").replace(/\s+/g, " ").trim() || "Unknown";
}
function Gu(e, t = /* @__PURE__ */ new Date()) {
	return `${Z(e)} - ${Wu(t)}.xlsx`;
}
function Ku(e = [], t = [], n = [], r = [], i = []) {
	return Vu.map((a) => a === "Daily Tasks" ? {
		name: a,
		rows: tl(t)
	} : a === "Unfulfillable" ? {
		name: a,
		rows: nu(e)
	} : a === "Stranded" ? {
		name: a,
		rows: q(n)
	} : a === "Suppressed" ? {
		name: a,
		rows: ku(r)
	} : a === "Shipping Queue" ? {
		name: a,
		rows: Nl(i)
	} : { name: a });
}
function qu(e = Vu.map((e) => ({ name: e }))) {
	return Bu(e);
}
function Ju(e, t, n = document) {
	let r = new ArrayBuffer(e.byteLength);
	new Uint8Array(r).set(e);
	let i = new Blob([r], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), a = URL.createObjectURL(i), o = n.createElement("a");
	o.href = a, o.download = t, n.body.append(o), o.click(), o.remove(), URL.revokeObjectURL(a);
}
//#endregion
//#region src/lib/shortcut.ts
function Yu(e) {
	let t = e.code === "Slash" || e.key === "/", n = e.metaKey || e.ctrlKey;
	return t && n && !e.altKey && !e.shiftKey;
}
//#endregion
//#region src/paletteApp.tsx
var Xu = "command-palette-extension-root", Zu = "data-s4e-palette-open", Qu = "__s4eSpotlightPasteGuard", $u = "geist-latin-wght-normal.woff2", ed = 120;
async function td(e) {
	let t = typeof chrome < "u" && typeof chrome.runtime?.getURL == "function" ? chrome.runtime.getURL($u) : "";
	if (t && !(typeof FontFace > "u" || !e.fonts)) try {
		let n = new FontFace("Geist Variable", `url("${t}")`, {
			display: "swap",
			style: "normal",
			weight: "100 900"
		});
		e.fonts.add(n), await n.load();
	} catch {}
}
function nd(e, t, n) {
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
function rd(e) {
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
function id(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot?.activeElement;) t = t.shadowRoot.activeElement;
	return t instanceof HTMLElement ? t : null;
}
function ad(e) {
	let t = parseFloat(e.defaultView?.getComputedStyle(e.documentElement).fontSize ?? "16");
	return !Number.isFinite(t) || t <= 0 ? 1 : 16 / t;
}
function od(e, t) {
	let n = ad(t);
	return e.style.zoom = String(n), n;
}
async function sd(e) {
	let t = await chrome.runtime.sendMessage({
		type: "OPEN_CASE_IDS",
		caseIds: e
	});
	if (!t?.ok) throw Error(t?.error ?? "The background worker did not respond.");
}
async function cd(e) {
	let t = await chrome.runtime.sendMessage({
		type: "OPEN_SHIPMENT_IDS",
		shipmentIds: e
	});
	if (!t?.ok) throw Error(t?.error ?? "The background worker did not respond.");
}
async function ld(e) {
	let t = await chrome.runtime.sendMessage({
		type: "OPEN_SKU_IDS",
		skuIds: e
	});
	if (!t?.ok) throw Error(t?.error ?? "The background worker did not respond.");
}
async function ud() {
	let e = await chrome.runtime.sendMessage({ type: "OPEN_TIME_OUT" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
}
async function dd(e) {
	let t = await chrome.runtime.sendMessage(e);
	if (!t?.ok) throw Error(t?.error ?? "The background worker did not respond.");
	return t;
}
async function fd() {
	let e = await dd({ type: "ACCOUNTS_STATUS" });
	return {
		initialized: e.initialized,
		unlocked: e.unlocked,
		stores: e.stores,
		activeSwitch: e.activeSwitch,
		currentStore: e.currentStore ?? null
	};
}
async function pd(e) {
	await dd({
		type: "ACCOUNTS_UNLOCK",
		masterPassword: e
	});
}
async function md(e) {
	await dd({
		type: "ACCOUNTS_START_SWITCH",
		storeId: e
	});
}
async function hd() {
	await dd({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" });
}
async function gd() {
	await dd({ type: "ACCOUNTS_FOCUS_SWITCH" });
}
async function _d() {
	await dd({ type: "ACCOUNTS_CANCEL_SWITCH" });
}
async function vd() {
	await dd({ type: "ACCOUNTS_OPEN_OPTIONS" });
}
async function yd() {
	if (typeof chrome > "u" || !chrome.runtime?.sendMessage) return dc(void 0);
	try {
		let e = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
		return e?.ok ? dc(e.settings) : dc(void 0);
	} catch {
		return dc(void 0);
	}
}
async function Q() {
	let e = await chrome.runtime.sendMessage({ type: "REPORTS_PREPARE" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
	return {
		loggedInToStore: !!e.loggedInToStore,
		openedPromptOnSellerCentral: e.openedPromptOnSellerCentral
	};
}
async function bd() {
	let e = await chrome.runtime.sendMessage({ type: "REPORTS_FETCH_UNFULFILLABLE" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
	return Array.isArray(e.listings) ? e.listings : [];
}
async function xd() {
	let e = await chrome.runtime.sendMessage({ type: "REPORTS_FETCH_FEEDBACK" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
	return Array.isArray(e.feedbacks) ? e.feedbacks : [];
}
async function Sd() {
	let e = await chrome.runtime.sendMessage({ type: "REPORTS_FETCH_STRANDED" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
	return Array.isArray(e.listings) ? e.listings : [];
}
async function Cd() {
	let e = await chrome.runtime.sendMessage({ type: "REPORTS_FETCH_SUPPRESSED" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
	return Array.isArray(e.listings) ? e.listings : [];
}
async function wd() {
	let e = await chrome.runtime.sendMessage({ type: "REPORTS_FETCH_SHIPPING_QUEUE" });
	if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
	return Array.isArray(e.shipments) ? e.shipments : [];
}
var Td = /* @__PURE__ */ new Set();
function Ed(e) {
	return Td.add(e), () => {
		Td.delete(e);
	};
}
function Dd(e) {
	for (let t of Td) t(e);
}
function Od(e, t, n, r) {
	return t.then((t) => (r?.({
		source: e,
		status: "complete"
	}), t), () => (r?.({
		source: e,
		status: "error"
	}), n));
}
async function kd(e = /* @__PURE__ */ new Date(), t = document, n, r) {
	let i = r ? Ed(r) : () => void 0;
	try {
		let i = n === void 0 ? (await fd()).currentStore?.name ?? "" : n;
		r?.({
			source: "unfulfillable",
			status: "active"
		}), r?.({
			source: "feedback",
			status: "active"
		}), r?.({
			source: "stranded",
			status: "active"
		}), r?.({
			source: "suppressed",
			status: "active"
		}), r?.({
			source: "shippingQueue",
			status: "active"
		});
		let [a, o, s, c, l] = await Promise.all([
			Od("unfulfillable", bd(), [], r),
			Od("feedback", xd(), [], r),
			Od("stranded", Sd(), [], r),
			Od("suppressed", Cd(), [], r),
			Od("shippingQueue", wd(), [], r)
		]);
		Ju(qu(Ku(a, o, s, c, l)), Gu(i, e), t);
	} finally {
		i();
	}
}
function Ad({ document: e = window.document, shadowMode: t = "closed" } = {}) {
	if (e.getElementById(Xu)) return null;
	let n = e.createElement("div");
	n.id = Xu, n.setAttribute(Zu, "false"), n.style.cssText = [
		"all: initial",
		"position: fixed",
		"inset: 0",
		"z-index: 2147483647",
		"pointer-events: none"
	].join(";"), od(n, e);
	let r = Vc(n, e.defaultView ?? window), i = n.attachShadow({ mode: t }), a = e.createElement("style");
	a.textContent = y, i.append(a);
	let o = e.createElement("div");
	o.className = "palette-scope", o.style.pointerEvents = "auto", i.append(o), (e.body ?? e.documentElement).append(n);
	let s = (0, v.createRoot)(o), c = !1, l = "commands", u = null, d = null, f = sc, p = 0, m = !1, h = td(e), g = yd().then((e) => {
		pc(f, e.features) || (f = e.features, c && b());
	}), b = () => {
		s?.render(/* @__PURE__ */ (0, R.jsx)(_.StrictMode, { children: /* @__PURE__ */ (0, R.jsx)(Bc, {
			container: i,
			enabledFeatures: f,
			initialMode: l,
			open: c,
			onOpenCaseIds: sd,
			onOpenShipmentIds: cd,
			onOpenSkuIds: ld,
			onGetAccountsStatus: fd,
			onUnlockAccounts: pd,
			onStartAccountSwitch: md,
			onFocusCurrentStore: hd,
			onFocusAccountSwitch: gd,
			onCancelAccountSwitch: _d,
			onManageAccounts: vd,
			onPrepareReports: Q,
			onGenerateReports: (t, n) => kd(/* @__PURE__ */ new Date(), e, t, n),
			onOpenTimeOut: ud,
			onOpenChange: x
		}) }));
	}, x = (t, r = "commands") => {
		if (l = t ? r : "commands", t === c) {
			t && b();
			return;
		}
		let i = ++p;
		t ? (u = id(e), d = rd(e)) : (d?.(), d = null), c = t, n.setAttribute(Zu, String(t)), n.style.pointerEvents = t ? "auto" : "none", t && od(n, e);
		let a = () => {
			i === p && (b(), t && yd().then((e) => {
				c && (pc(f, e.features) || (f = e.features, b()));
			}), t || requestAnimationFrame(() => u?.focus({ preventScroll: !0 })));
		};
		if (t && !m) {
			nd(Promise.all([h, g]), ed, e.defaultView).then(() => {
				m = !0, a();
			});
			return;
		}
		a();
	}, S = (e) => {
		Yu(e) && (e.preventDefault(), e.stopImmediatePropagation(), x(!c));
	};
	e.defaultView?.addEventListener("keydown", S, !0);
	let C = (e) => {
		Xs(e) && Dd(e);
	};
	return typeof chrome < "u" && chrome.runtime?.onMessage?.addListener(C), {
		host: n,
		shadowRoot: i,
		setOpen: x,
		destroy: () => {
			n.setAttribute(Zu, "false"), d?.(), d = null, e.defaultView?.removeEventListener("keydown", S, !0), typeof chrome < "u" && chrome.runtime?.onMessage?.removeListener(C), e.defaultView?.[Qu]?.destroy(), r(), s?.unmount(), s = null, n.remove();
		}
	};
}
//#endregion
export { _d as cancelAccountSwitch, xd as fetchFeedbacksFromBackground, wd as fetchShippingQueueFromBackground, Sd as fetchStrandedListingsFromBackground, Cd as fetchSuppressedListingsFromBackground, bd as fetchUnfulfillableListingsFromBackground, gd as focusAccountSwitch, hd as focusCurrentStore, kd as generateReports, fd as getAccountsStatus, ad as getPaletteRemScale, yd as getSettings, td as loadPaletteFont, vd as manageAccounts, Ad as mountCommandPalette, sd as openCaseIds, cd as openShipmentIds, ld as openSkuIds, ud as openTimeOut, Q as prepareReports, md as startAccountSwitch, Ed as subscribeReportProgress, pd as unlockAccounts };
