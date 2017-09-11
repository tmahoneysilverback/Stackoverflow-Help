(function(window, angular, undefined) {
	angular.module('app')
		.controller('priceSavingsCtrl', ['$scope', '$state', '$http', '$stateParams', 'userSvc', 'invoiceSvc', 'invoiceXPOSvc', 'invoiceSaiaSvc', function($scope, $state, $http, $stateParams, userSvc, invoiceSvc, invoiceXPOSvc, invoiceSaiaSvc) {

			var config = {
				headers: {
					'auth-token': userSvc.token
				}
			};

			$scope.exportData = function() {
				setTimeout(function() {
					var blob = new Blob([document.getElementById('savings_report').innerHTML], {
						type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
					});
					var blob2 = new Blob([document.getElementById('xpo_data').innerHTML], {
						type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
					});
					var blob3 = new Blob([document.getElementById('saia_data').innerHTML], {
						type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
					});
					var blob4 = new Blob([document.getElementById('all_data').innerHTML], {
						type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
					});
					saveAs(blob, "Savings-Report-" + $scope.client_name + '-' + moment().format('YYYY/DD/MM') + ".xls");
					saveAs(blob2, "XPO-Data-" + $scope.client_name + '-' + moment().format('YYYY/DD/MM') + ".xls");
					saveAs(blob3, "Saia-Data-" + $scope.client_name + '-' + moment().format('YYYY/DD/MM') + ".xls");
					saveAs(blob4, "All-Data-" + $scope.client_name + '-' + moment().format('YYYY/DD/MM') + ".xls");
				}, 500);
			};

			$scope.savingsInvoices = [];
			$scope.associatedCosts = [];

			$scope.totalBenchmarkFrieghtCharge = 0;
			$scope.totalBenchmarkCharge = 0;
			$scope.totalBenchmarkAccessorial = 0;
			$scope.totalFuelBenchmark = 0;
			$scope.totalCharged = 0;
			$scope.totalAccesorialCharge = 0;
			$scope.totalFreightCharge = 0;
			$scope.totalFuelCharge = 0;
			$scope.state = $state.current;
			$scope.params = $stateParams;

			$scope.recalculation = function(invoice, text) {
				$scope.totalFuelBenchmark = 0;
				$scope.totalBenchmarkAccessorial = 0;
				$scope.totalBenchmarkFrieghtCharge = 0;
				$scope.totalBenchmarkCharge = 0;
				$scope.totalAccesorialCharge = 0;
				$scope.totalCharged = 0;
				$scope.totalFreightCharge = 0;
				$scope.totalFuelCharge = 0;

				for (var i in $scope.savingsInvoices) {
					if ($scope.savingsInvoices[i].invoice_id === invoice.invoice_id) {
						$scope.savingsInvoices[i] = invoice;
						if (text === 'simple') {
							$scope.savingsInvoices[i].benchmark_charge = $scope.savingsInvoices[i].benchmark_fuel_charge + $scope.savingsInvoices[i].freight_charge + $scope.savingsInvoices[i].benchamrk_access;
							$scope.savingsInvoices[i].savings_total_charge = $scope.savingsInvoices[i].savings_fuel_surcharge + $scope.savingsInvoices[i].savings_frieght_charge + $scope.savingsInvoices[i].assess_charge;
						} else if (text === 'complex') {
							//benchmark recalculation
							$scope.savingsInvoices[i].benchmark_fuel_charge = (invoice.freight_charge * (invoice.benchmark_fuel_surcharge / 100) * invoice.fsc_factor / 100);
							$scope.savingsInvoices[i].benchmark_charge = Math.round(($scope.savingsInvoices[i].benchmark_fuel_charge + $scope.savingsInvoices[i].freight_charge + $scope.savingsInvoices[i].total_benchmark) * 100) / 100;
							//savings recalculation 
							var fuelSurchargePercent = (Math.round(invoice.fuel_surcharge*100)/ 10000);
							var unroundedFuelCharge = (invoice.savings_frieght_charge * fuelSurchargePercent);
							$scope.savingsInvoices[i].savings_fuel_surcharge = Math.round(unroundedFuelCharge * 100)/100;
							$scope.savingsInvoices[i].savings_total_charge = Math.round(($scope.savingsInvoices[i].savings_fuel_surcharge + $scope.savingsInvoices[i].savings_frieght_charge + $scope.savingsInvoices[i].assess_charge) * 100) / 100;
						}
					}

					
					$scope.totalFuelBenchmark += $scope.savingsInvoices[i].benchmark_fuel_charge;
					$scope.totalBenchmarkAccessorial += parseFloat($scope.savingsInvoices[i].total_benchmark);
					$scope.totalBenchmarkFrieghtCharge += $scope.savingsInvoices[i].freight_charge;
					$scope.totalBenchmarkCharge += $scope.savingsInvoices[i].benchmark_charge;
					$scope.totalAccesorialCharge += parseFloat($scope.savingsInvoices[i].total_associated_costs);
					$scope.totalCharged += $scope.savingsInvoices[i].savings_total_charge;
					$scope.totalFreightCharge += $scope.savingsInvoices[i].savings_frieght_charge;
					$scope.totalFuelCharge += parseFloat($scope.savingsInvoices[i].savings_fuel_surcharge);
				}
				for (i in $scope.savingsXPOInvoices) {
					$scope.totalBenchmarkFrieghtCharge += parseFloat($scope.savingsXPOInvoices[i].old_cost);
					$scope.totalFuelBenchmark += parseFloat($scope.savingsXPOInvoices[i].old_fsc);
					$scope.totalBenchmarkCharge += parseFloat($scope.savingsXPOInvoices[i].old_total_cost);
					$scope.totalFreightCharge += parseFloat($scope.savingsXPOInvoices[i].new_cost);
					$scope.totalFuelCharge += parseFloat($scope.savingsXPOInvoices[i].new_fsc);
					$scope.totalCharged += parseFloat($scope.savingsXPOInvoices[i].new_total_cost);
				}
				for (i in $scope.savingsSaiaInvoices) {
					$scope.totalBenchmarkFrieghtCharge += parseFloat($scope.savingsSaiaInvoices[i].old_cost_saia);
					$scope.totalFuelBenchmark += parseFloat($scope.savingsSaiaInvoices[i].old_fsc_dollar);
					$scope.totalBenchmarkCharge += parseFloat($scope.savingsSaiaInvoices[i].old_total_cost_dollar);
					$scope.totalFreightCharge += parseFloat($scope.savingsSaiaInvoices[i].new_cost);
					$scope.totalFuelCharge += parseFloat($scope.savingsSaiaInvoices[i].new_fsc_dollar);
					$scope.totalCharged += parseFloat($scope.savingsSaiaInvoices[i].new_total_cost_dollar);
				}
			};

			$scope.calculation = function() {
				$scope.totalFuelBenchmark = 0;
				$scope.totalBenchmarkAccessorial = 0;
				$scope.totalBenchmarkFrieghtCharge = 0;
				$scope.totalBenchmarkCharge = 0;
				$scope.totalAccesorialCharge = 0;
				$scope.totalCharged = 0;
				$scope.totalFreightCharge = 0;
				$scope.totalFuelCharge = 0;
				for (var i = 0; i < $scope.savingsInvoices.length; i++) {
					$scope.savingsInvoices[i].process_date = new Date($scope.savingsInvoices[i].process_date);
					$scope.savingsInvoices[i].ship_date = new Date($scope.savingsInvoices[i].ship_date);
					$scope.savingsInvoices[i].delivery_date = new Date($scope.savingsInvoices[i].delivery_date);
					$scope.savingsInvoices[i].carrier_discount = Math.round($scope.savingsInvoices[i].carrier_discount * 100);
					$scope.savingsInvoices[i].discount = Math.round($scope.savingsInvoices[i].discount * 10000) / 100;
					$scope.savingsInvoices[i].gross_charge = parseFloat($scope.savingsInvoices[i].gross_charge);
					$scope.savingsInvoices[i].absolute_min_charge = parseFloat($scope.savingsInvoices[i].absolute_min_charge);
					$scope.savingsInvoices[i].fsc_factor = Math.round($scope.savingsInvoices[i].fsc_factor * 10000) / 100;
					$scope.savingsInvoices[i].bmfsc_factor = $scope.savingsInvoices[i].fsc_factor + '%';
					$scope.savingsInvoices[i].fuel_surcharge = Math.round($scope.savingsInvoices[i].fuel_surcharge * 10000) / 100;
					$scope.savingsInvoices[i].benchmark_fuel_surcharge = Math.round($scope.savingsInvoices[i].benchmark_fuel_surcharge * 10000) / 100;
					$scope.savingsInvoices[i].bfsc_percent = $scope.savingsInvoices[i].benchmark_fuel_surcharge + '%';
					$scope.savingsInvoices[i].accelerated_charge = parseFloat($scope.savingsInvoices[i].accelerated_charge);
					$scope.savingsInvoices[i].deficit = parseFloat($scope.savingsInvoices[i].deficit);
					$scope.savingsInvoices[i].rated_sum = parseFloat($scope.savingsInvoices[i].rated_sum);
					$scope.savingsInvoices[i].deficit_rate = parseFloat($scope.savingsInvoices[i].deficit_rate);
					$scope.savingsInvoices[i].benchamrk_access = parseFloat($scope.savingsInvoices[i].benchamrk_access);
					$scope.savingsInvoices[i].assess_charge = parseFloat($scope.savingsInvoices[i].assess_charge);

					var grossCharge = 0;
					var deficitRate = 0;
					if ($scope.savingsInvoices[i].carrier_id === 5) {
						grossCharge = $scope.savingsInvoices[i].rated_sum;
						deficitRate = $scope.savingsInvoices[i].deficit_rate;

					} else {
						grossCharge = $scope.savingsInvoices[i].gross_charge;
						deficitRate = $scope.savingsInvoices[i].deficit;
					}

					//benchmark
					if ((((grossCharge + deficitRate) * (100 - $scope.savingsInvoices[i].discount)) / 100) <= 88.39) {
						$scope.savingsInvoices[i].freight_charge = 88.39;
						$scope.savingsInvoices[i].bmdiscount = 'AMC';
					} else {
						$scope.savingsInvoices[i].bmdiscount = $scope.savingsInvoices[i].discount + '%';
						$scope.savingsInvoices[i].freight_charge = (Math.round(((grossCharge + deficitRate) * (100 - $scope.savingsInvoices[i].discount))) / 100);
					}


					//savings
					if (((($scope.savingsInvoices[i].gross_charge + $scope.savingsInvoices[i].deficit_rate) * (100 - $scope.savingsInvoices[i].carrier_discount)) / 100) <= $scope.savingsInvoices[i].absolute_min_charge) {
						$scope.savingsInvoices[i].savings_discount = 'AMC';
						$scope.savingsInvoices[i].savings_frieght_charge = $scope.savingsInvoices[i].absolute_min_charge;
					} else {
						$scope.savingsInvoices[i].savings_discount = $scope.savingsInvoices[i].carrier_discount + '%';
						$scope.savingsInvoices[i].savings_frieght_charge = Math.round((($scope.savingsInvoices[i].gross_charge + $scope.savingsInvoices[i].deficit) * (100 - $scope.savingsInvoices[i].carrier_discount))) / 100;
					}

					//Accelerated Service
					if ($scope.savingsInvoices[i].accelerated_service === true) {
						$scope.savingsInvoices[i].savings_accelerated_charge = Math.round(($scope.savingsInvoices[i].savings_frieght_charge * $scope.savingsInvoices[i].accelerated_charge) * 100) / 100;

						$scope.savingsInvoices[i].benchmark_accelerated_charge = Math.round(($scope.savingsInvoices[i].freight_charge * $scope.savingsInvoices[i].accelerated_charge) * 100) / 100;

						if ($scope.savingsInvoices[i].savings_accelerated_charge < 30) {
							$scope.savingsInvoices[i].savings_accelerated_charge = 30;
							if ($scope.savingsInvoices[i].benchmark_accelerated_charge < $scope.savingsInvoices[i].savings_accelerated_charge) {
								$scope.savingsInvoices[i].benchmark_accelerated_charge = $scope.savingsInvoices[i].savings_accelerated_charge;
							}
						}
						$scope.savingsInvoices[i].total_associated_costs = parseFloat($scope.savingsInvoices[i].total_associated_costs) + $scope.savingsInvoices[i].savings_accelerated_charge;
						$scope.savingsInvoices[i].total_benchmark = parseFloat($scope.savingsInvoices[i].total_benchmark) + $scope.savingsInvoices[i].savings_accelerated_charge;
					} else {
						$scope.savingsInvoices[i].savings_accelerated_charge = 0;
						$scope.savingsInvoices[i].benchmark_accelerated_charge = 0;
						$scope.savingsInvoices[i].total_associated_costs = parseFloat($scope.savingsInvoices[i].total_associated_costs);
						$scope.savingsInvoices[i].total_benchmark = parseFloat($scope.savingsInvoices[i].total_benchmark);
					}

					//fuel charge
					var math = 0;
					math = $scope.savingsInvoices[i].freight_charge;
					math = $scope.savingsInvoices[i].freight_charge + $scope.savingsInvoices[i].savings_accelerated_charge;

					$scope.savingsInvoices[i].savings_fuel_surcharge = Math.round((($scope.savingsInvoices[i].savings_frieght_charge + $scope.savingsInvoices[i].savings_accelerated_charge) * ($scope.savingsInvoices[i].fuel_surcharge / 100)) * 100) / 100;
					$scope.savingsInvoices[i].benchmark_fuel_charge = Math.round((($scope.savingsInvoices[i].benchmark_fuel_surcharge / 100 * $scope.savingsInvoices[i].fsc_factor / 100) * math) * 100) / 100;




					$scope.savingsInvoices[i].savings_total_charge = Math.round((parseFloat($scope.savingsInvoices[i].savings_frieght_charge) + parseFloat($scope.savingsInvoices[i].savings_fuel_surcharge) + parseFloat($scope.savingsInvoices[i].total_associated_costs)) * 100) / 100;
					$scope.savingsInvoices[i].benchmark_charge = $scope.savingsInvoices[i].benchmark_fuel_charge + $scope.savingsInvoices[i].freight_charge + $scope.savingsInvoices[i].total_benchmark;

					//totals
					$scope.totalFuelBenchmark += $scope.savingsInvoices[i].benchmark_fuel_charge;
					$scope.totalBenchmarkAccessorial += parseFloat($scope.savingsInvoices[i].total_benchmark);
					$scope.totalBenchmarkFrieghtCharge += $scope.savingsInvoices[i].freight_charge;
					$scope.totalBenchmarkCharge += $scope.savingsInvoices[i].benchmark_charge;
					$scope.totalAccesorialCharge += parseFloat($scope.savingsInvoices[i].total_associated_costs);
					$scope.totalCharged += $scope.savingsInvoices[i].savings_total_charge;
					$scope.totalFreightCharge += $scope.savingsInvoices[i].savings_frieght_charge;
					$scope.totalFuelCharge += parseFloat($scope.savingsInvoices[i].savings_fuel_surcharge);
				}

				for (i in $scope.savingsXPOInvoices) {
					$scope.totalBenchmarkFrieghtCharge += parseFloat($scope.savingsXPOInvoices[i].old_cost);
					$scope.totalFuelBenchmark += parseFloat($scope.savingsXPOInvoices[i].old_fsc);
					$scope.totalBenchmarkCharge += parseFloat($scope.savingsXPOInvoices[i].old_total_cost);
					$scope.totalFreightCharge += parseFloat($scope.savingsXPOInvoices[i].new_cost);
					$scope.totalFuelCharge += parseFloat($scope.savingsXPOInvoices[i].new_fsc);
					$scope.totalCharged += parseFloat($scope.savingsXPOInvoices[i].new_total_cost);
				}
				for (i in $scope.savingsSaiaInvoices) {
					$scope.totalBenchmarkFrieghtCharge += parseFloat($scope.savingsSaiaInvoices[i].old_cost_saia);
					$scope.totalFuelBenchmark += parseFloat($scope.savingsSaiaInvoices[i].old_fsc_dollar);
					$scope.totalBenchmarkCharge += parseFloat($scope.savingsSaiaInvoices[i].old_total_cost_dollar);
					$scope.totalFreightCharge += parseFloat($scope.savingsSaiaInvoices[i].new_cost);
					$scope.totalFuelCharge += parseFloat($scope.savingsSaiaInvoices[i].new_fsc_dollar);
					$scope.totalCharged += parseFloat($scope.savingsSaiaInvoices[i].new_total_cost_dollar);
				}
			};

			if ($scope.params.invoiceIDs) {
				invoiceSvc
					.getPriceSavingsInvoices($scope.params.invoiceIDs, config)
					.then(function(message) {
						$scope.savingsInvoices = message;
						for (var i in $scope.savingsInvoices) {
							$scope.savingsInvoices[i].ACCSCosts = [];
							$scope.savingsInvoices[i].shipped_Item = [];
						}
						$scope.process_date = $scope.savingsInvoices[0].process_date;
						$scope.client_name = $scope.savingsInvoices[0].client_name;
						if ($scope.params.xpoIDs) {
							invoiceXPOSvc
								.getPriceSavingsInvoicesXPO($scope.params.xpoIDs, config)
								.then(function(message) {
									$scope.savingsXPOInvoices = message;
									$scope.getAssoccClass();
									$scope.calculation();
								});
						} else if ($scope.params.saiaIDs) {
							invoiceSaiaSvc
								.getPriceSavingsInvoicesSaia($scope.params.saiaIDs, config)
								.then(function(message) {
									$scope.savingsSaiaInvoices = message;
									$scope.getAssoccClass();
									$scope.calculation();
								});
						} else {
							$scope.getAssoccClass();
							$scope.calculation();
						}
					});
			} else if ($scope.params.XPOinvoiceIDs) {
				invoiceXPOSvc
					.getPriceSavingsInvoicesXPO($scope.params.xpoIDs, config)
					.then(function(message) {
						$scope.savingsXPOInvoices = message;
						$scope.process_date = $scope.savingsXPOInvoices[0].process_date;
						$scope.client_name = $scope.savingsXPOInvoices[0].client_name;
						$scope.calculation();
					});
			} else if ($scope.params.SaiainvoiceIDs) {
				invoiceSaiaSvc
					.getPriceSavingsInvoicesSaia($scope.params.saiaIDs, config)
					.then(function(message) {
						$scope.savingsSaiaInvoices = message;
						$scope.process_date = $scope.savingsSaiaInvoices[0].process_date;
						$scope.client_name = $scope.savingsSaiaInvoices[0].client_name;
						$scope.calculation();
					});
			}

			$scope.getAssoccClass = function() {
				$http.get('/secure-api/accessorial_cost_invoice/get_associated_costs_invoices', config)
					.then(function(response) {
						$scope.ACCSCosts = response.data.data;
						for (var i in $scope.ACCSCosts) {
							$scope.ACCSCosts[i].invoice_number = undoCleanEntry($scope.ACCSCosts[i].invoice_number);
							for (var j in $scope.savingsInvoices) {
								if ($scope.ACCSCosts[i].invoice_number === $scope.savingsInvoices[j].invoice_number) {
									$scope.savingsInvoices[j].ACCSCosts.push($scope.ACCSCosts[i]);
								}
							}
						}
					}, function(err) {
						console.log(err);
					});

				$http.get('/secure-api/shipping_class_invoice/get_shipping_class_invoice', config)
					.then(function(response) {
						$scope.shipped_Item = response.data.data;
						for (var i in $scope.shipped_Item) {
							$scope.shipped_Item[i].invoice_number = undoCleanEntry($scope.shipped_Item[i].invoice_number);
							for (var j in $scope.savingsInvoices) {
								if ($scope.shipped_Item[i].invoice_number === $scope.savingsInvoices[j].invoice_number) {
									$scope.savingsInvoices[j].shipped_Item.push($scope.shipped_Item[i]);
								}
							}
						}
					}, function(err) {
						console.log(err);
					});
				console.log($scope.savingsInvoices.length);
			};

		}]);
})(window, window.angular);