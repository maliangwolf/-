
		/**
	 * 根据财务业务要求  计算资金成本率
	 * 
	 * @param rze 融资额 或 万元系数
	 * @param months 期限（月）
	 * @param yearRate 年利率
	 * @param gRate 保证金利率
	 * @param sRate 手续费率
	 * @return 
	 * @date 2018年11月20日下午3:01:28 
	 * @author ml
	 */ 
	function getJyIRR( rze,  months,  yearRate,  gRate, sRate) {
		//alert(rze+","+months+","+yearRate+","+gRate+","+sRate+","+sRate);
		var flowInArr = new Array();
		//第0期及最后一期的金额需要额外进行计算  中间期数使用PMT计算值（等额本息还款金额）
		var flowOut = roundDouble(rze * -1 + rze * gRate + rze * sRate,2);// 第0期金额
		//alert(flowOut);
		flowInArr[0]=flowOut;
		//月供（等额本息）
		var pmtValue=getPerMonthPrincipalvarerest(rze, yearRate, months);
		for (var i = 1; i < months; i++) {
			flowInArr[i]=pmtValue;
		}
		flowInArr[months]=roundDouble(pmtValue-rze * gRate,2);//最后一期
		//alert(flowInArr);
		return roundDouble(getIrr(flowInArr) * 12*100,2);
	}
		
	/**
	 * 根据财务业务要求  计算资金费率
	 * 
	 * @param rze
	 * @param months
	 * @param yearRate
	 * @return 
	 * @date 2018年11月20日下午3:35:15 
	 * @author ml
	 */
	function  getFeeRate( rze,  months,  yearRate){
		//月供（等额本息）
		var pmtValue=getPerMonthPrincipalvarerest(rze, yearRate, months);
		//总租金
		var totalRent=roundDouble(pmtValue*months,2);
		//总利息
		var totalInterest=roundDouble(totalRent-rze,2);
		//总费率 
		var feeRate=roundDouble(totalInterest/rze*100,2);
		//年化费率
		var yearFeeRate=roundDouble(totalInterest/rze/(months/12)*100,2);
		//月费率
		var monthFeeRate=roundDouble(totalInterest/rze/months*100,2);
		var obj=new Object();
		obj.pmtValue=pmtValue;
		obj.totalRent=totalRent;
		obj.totalInterest=totalInterest;
		obj.feeRate=feeRate;
		obj.yearFeeRate=yearFeeRate;
		obj.monthFeeRate=monthFeeRate;
		//alert(pmtValue+","+totalRent+","+totalInterest+","+feeRate+","+yearFeeRate+","+monthFeeRate);
		return obj;
	}
	
		/**
	 * 根据财务业务要求  根据费率计算年化费率
	 * 
	 * @param rze
	 * @param months
	 * @param yearRate
	 * @return 
	 * @date 2018年11月20日下午3:35:15 
	 * @author ml
	 */
	function  getYearRate( rze,  months,  feeRate){
		//总利息
		var totalInterest=roundDouble(rze*feeRate,2);
		//月供（等额本息）
		var pmtValue=roundDouble((rze*1+totalInterest*1)/months,2);
		//alert(pmtValue);
		//年化利率
		var yearRate=roundDouble(rate(months, pmtValue, rze*-1, 0, 0)*12*100,2);
		//alert(rate(months, pmtValue, rze*-1, 0, 0)*12*100);
		var obj=new Object();
		obj.pmtValue=pmtValue;
		obj.yearRate=yearRate;
		obj.totalInterest=totalInterest;
		//alert(pmtValue+","+totalRent+","+totalInterest+","+feeRate+","+yearFeeRate+","+monthFeeRate);
		return obj;
	}

    /**
     * excel rate函数
     * @param npr
     * @param pmt
     * @param pv
     * @param fv
     * @param type
     * @return 
     * @date 2018年11月21日上午10:35:30 
     * @author ml
     */
   function rate( npr,  pmt,  pv,  fv,  type) {
		var financialPrecision = 0.00000001; // 1.0e-08*
		var financialMaxIterations = 128;
        var rate = 0.1;
        var y;
        var f = 0.0;
        if (Math.abs(rate) < financialPrecision) {
            y = pv * (1 + npr * rate) + pmt * (1 + rate * type) * npr + fv;
        } else {
            f = Math.exp(npr * Math.log(1 + rate));
            y = pv * f + pmt * (1 / rate + type) * (f - 1) + fv;
        }
        var y0 = pv + pmt * npr + fv;
        var y1 = pv * f + pmt * (1 / rate + type) * (f - 1) + fv;
        var i = 0;
        var x0 = 0.0;
        var x1 = rate;
        while ((Math.abs(y0 - y1) > financialPrecision) && (i < financialMaxIterations)) {
            rate = (y1 * x0 - y0 * x1) / (y1 - y0);
            x0 = x1;
            x1 = rate;
            if (Math.abs(rate) < financialPrecision) {
                y = pv * (1 + npr * rate) + pmt * (1 + rate * type) * npr + fv;
            } else {
                f = Math.exp(npr * Math.log(1 + rate));
                y = pv * f + pmt * (1 / rate + type) * (f - 1) + fv;
            }
            y0 = y1;
            y1 = y;
            i++;
        }
        return rate;
    }

	/**
	 * @desc excel IRR方法
	 * @param cashFlow
	 *            资金流
	 * @return 收益率
	 */
	function getIrr(cashFlow) {
		/** 迭代次数 */
		var LOOPNUM = 1000;
		/** 最小差异 */
		var MINDIF = 0.00000001;
		var flowOut = cashFlow[0];
		var minValue = 0;
		var maxValue = 1;
		var testValue = 0;
		while (LOOPNUM > 0) {
			testValue = (minValue + maxValue) / 2;
			var npv = NPV(cashFlow, testValue);
			if (Math.abs(flowOut + npv) < MINDIF) {
				break;
			} else if (Math.abs(flowOut) > npv) {
				maxValue = testValue;
			} else {
				minValue = testValue;
			}
			LOOPNUM--;
		}
		return testValue;
	}

	function NPV(flowInArr, rate) {
		var npv = 0;
		for (var i = 1; i < flowInArr.length; i++) {
			npv += flowInArr[i] / Math.pow(1 + rate, i);
		}
		return npv;
	}
	
  /**
     * 等额本息计算获取还款方式为等额本息的每月偿还本金和利息
     * 
     * 公式：每月偿还本息=〔贷款本金×月利率×(1＋月利率)＾还款月数〕÷〔(1＋月利率)＾还款月数-1〕
     * 
     * @param invest
     *            总借款额（贷款本金）
     * @param yearRate
     *            年利率
     * @param month
     *            还款总月数
     * @return 每月偿还本金和利息,不四舍五入，直接截取小数点最后两位
     */
    function getPerMonthPrincipalvarerest( invest,  yearRate,  totalmonth) {
        var monthRate = yearRate / 12;
        var monthIncome = (invest*monthRate * Math.pow(1 + monthRate, totalmonth))/(Math.pow(1 + monthRate, totalmonth) - 1);
        return roundDouble(monthIncome,2);
    }
	
		/**
	 *  对double类型数字进行四舍五入操作
	 * @param val
	 * @param scale 精度 保留几位小数
	 * @return 
	 * @date 2018年11月20日下午3:20:01 
	 * @author ml
	 */
	function roundDouble(val, scale){
		return val.toFixed(scale);
	}