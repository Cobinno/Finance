var route = require("express").Router();
const database = require("../config/database");
const axios = require('axios');



route.post("/GetAreaDaily", (req, res) => {
    var date=getdate();
    console.log(req.body.LoanType)
    database.RequestDatabase.query(
      "SELECT DISTINCT bro.Area, SUM(ld.emi) AS TotalEMI,(select sum(lp.LoanPaidAmount)As 'Amount' From dbo.borrower AS br INNER JOIN dbo.loan AS ld ON br.BorrowerId = ld.BorrowerId inner join dbo.ref_LoanPaid as lp on lp.LoanCode = ld.loancode where ld.IsActive = '1'and br.IsActive=1 and lp.Date='"+date+"' and  br.area=bro.area and ld.loanType='"+req.body.LoanType+"') as 'Totalcollection' FROM dbo.borrower AS bro inner JOIN dbo.loan AS ld ON bro.BorrowerId = ld.BorrowerId WHERE ld.LoanType = '"+req.body.LoanType+"' AND ld.IsActive = '1' AND ld.stardt!='"+date+"' GROUP BY bro.Area",
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error");
        } else {
           console.log(result);
          res.send(JSON.stringify(result["recordsets"]));
        }
      }
    );
  });


  route.post("/GetLoanDetails", (req, res) => {
    var date=getdate();
   database.RequestDatabase.query(
      "select br.BorrowerName AS 'Name', br.Area as 'Area',ld.LoanCode AS 'Lcode', ld.emi as 'Emi',ld.LoanAmount AS 'Amount', (select sum(loanpaidAmount) from ref_LoanPaid where loancode= ld.LoanCode and Date='"+date+"' ) AS 'PaidAmount' FROM dbo.loan AS ld right JOIN dbo.borrower AS br ON ld.BorrowerId=br.BorrowerId inner JOIN ref_LoanPaid AS lp ON ld.LoanCode = lp.LoanCode where br.Area ='"+req.body.Area+"' and br.IsActive=1 and ld.IsActive=1 and ld.LoanType='"+req.body.Type+"' and lp.date='"+date+"'  GROUP BY br.BorrowerName, ld.LoanCode, ld.LoanAmount,br.Area,ld.emi order by br.Area",
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error");
        } else {
          // console.log(result);
          res.send(JSON.stringify(result["recordsets"]));
        }
      }
    );
  });



  
  route.post("/GetLoanTotalEmi", (req, res) => {
    var date=getYesterdayDate();
    // console.log(date)
    if (!req.body.Area==""||!req.body.Area==null) {
      database.RequestDatabase.query(
        "select sum(emi) as 'Emi' from loan inner join borrower as br on loan.borrowerID = br.borrowerid where convert(date,startDt,103) between convert(date,'08-05-2023',103) And convert(date,'"+date+"',103) And  loan.IsActive='1' And br.area='"+req.body.Area+"'",
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error");
          } else {
            console.log(result);
            res.send(JSON.stringify(result["recordsets"]));
          }
        }
      );
    } else {
      database.RequestDatabase.query(
        "select sum(emi) as 'Emi' from loan  where convert(date,startDt,103) between convert(date,'08-05-2023',103) And convert(date,'"+date+"',103) And  loan.IsActive='1'",
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error");
          } else {
            console.log(result);
            res.send(JSON.stringify(result["recordsets"]));
          }
        }
      );
    }
  
  });


  route.post("/GetLoanTotalPaidAmount", (req, res) => {
    var date=getdate();
    // console.log(date)
    if (!req.body.Area==""||!req.body.Area==null) {
      database.RequestDatabase.query(
        "select sum(lp.LoanPaidAmount)As 'Amount' From dbo.borrower AS br INNER JOIN dbo.loan AS ld ON br.BorrowerId = ld.BorrowerId inner join dbo.ref_LoanPaid as lp on lp.LoanCode = ld.loancode where ld.IsActive = '1'and br.IsActive=1 and lp.Date='"+date+"' and  br.area='"+req.body.Area+"'",
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error");
          } else {
            // console.log(result);
            res.send(JSON.stringify(result["recordsets"]));
          }
        }
      );
    } else {
      database.RequestDatabase.query(
        "select sum(lp.LoanPaidAmount)As 'Amount' From dbo.borrower AS br INNER JOIN dbo.loan AS ld ON br.BorrowerId = ld.BorrowerId inner join dbo.ref_LoanPaid as lp on lp.LoanCode = ld.loancode where ld.IsActive = '1'and br.IsActive=1 and lp.Date='"+date+"'",
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error");
          } else {
            // console.log(result);
            res.send(JSON.stringify(result["recordsets"]));
          }
        }
      );
    }
   
  });



  route.post("/PayAmount", (req, res) => {
    var date=getdate();
    var time=gettime();
    console.log(date);
     database.RequestDatabase.query(
      "update dbo.ref_LoanPaid set LoanPaidAmount ="+parseInt(req.body.LoanPaidAmount)+",AgentId="+parseInt(req.body.AgentId)+",IsCompleted='1' where Date='"+date+"' and LoanCode='"+req.body.LoanCode+"'",
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error");
        } else {

          res.send(JSON.stringify(result["recordsets"]));
          const apiUrl = 'http://103.207.1.94:8080/collection/LoanCompleted';
          const jsonData = {
            'LoanCode': req.body.LoanCode,
          };
          axios.post(apiUrl, jsonData)
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            console.error(error);
          });
        }
      }
    );
    
  });




  function gettime(){
    let currentDate = new Date();
    let timeZone = 'Asia/Kolkata';
    let cur_date_time= currentDate.toLocaleTimeString('en-US', { timeZone: timeZone , hour12: true, hour: 'numeric', minute: 'numeric'});
    return cur_date_time
  }
  function getdate() {
    let currentDate = new Date();
    let formattedDate = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
    }).replace(/\//g, '-');
    return formattedDate
}
function getYesterdayDate() {
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1);
  let formattedDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
  }).replace(/\//g, '-');
  return formattedDate;
}

function getFutureDate(days) {
  let currentDate = new Date();
  let futureDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
  let formattedDate = futureDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
  }).replace(/\//g, '-');
  return formattedDate;
}





route.post("/GetLoanuserData", (req, res) => {
   database.RequestDatabase.query(
    "select borrowerName as 'Name',loanAmount as 'Amount',startDt as 'Start',endDt as 'End',sum(LoanPaidAmount) as 'Due' from dbo.loan as ld inner join dbo.ref_LoanPaid as lp on ld.loancode = lp.LoanCode where lp.LoanCode='"+req.body.LoanCode+"' Group by borrowerName,loanAmount,startDt,endDt",
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error");
      } else {
        // console.log(result);
        res.send(JSON.stringify(result["recordsets"]));
      }
    }
  );
});



route.post("/GetLoanCompleteData", (req, res) => {
   database.RequestDatabase.query(
    "select borrowerName as 'Name',loanAmount as 'Amount',startDt as 'Start',endDt as 'End',LoanPaidAmount as 'Due',Date as 'DueDate' from dbo.loan as ld inner join dbo.ref_LoanPaid as lp on ld.loancode = lp.LoanCode where lp.LoanCode='"+req.body.LoanCode+"' ORDER BY LoanPaidId",
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error");
      } else {
        // console.log(result);
        res.send(JSON.stringify(result["recordsets"]));
      }
    }
  );
});


route.post("/CompleteCollection", (req, res) => {
  var date=getdate();
  var time=gettime();

  if (!req.body) {
    return res.status(400).send("Request body is missing");
  }
     else{
       database.RequestDatabase.query(
        "insert into dbo.CollectionLog (AgentId,CompletedStatus,TotalCollectionAmount,date,time) values("+parseInt(req.body.AgentId)+",'1', (select sum(loanpaidamount)from ref_loanpaid where agentid= "+parseInt(req.body.AgentId)+" and date='"+date+"'),'"+date+"','"+time+"')",
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error");
          } else {
            console.log(result);
            res.send("success");
          }
        }
      );

     }
    });
  


route.post("/LoanCompleted", (req, res) => {

  var time=gettime();
  var dateinfuture=getFutureDate(1);
  if (!req.body) {
    return res.status(400).send("Request body is missing");
  }
  var query= database.RequestDatabase.query("select * from dbo.ref_LoanPaid where Date='"+dateinfuture+"' and LoanCode='"+req.body.LoanCode+"' and  IsCompleted= '0'",(err,result)=>{
    if(err){
      console.log(err);
    }
    else{
     if( result["recordset"].length!=0){
      res.send("Already Exist");
     }
     else{
       database.RequestDatabase.query(
        "update dbo.loan set isActive = '0' where loancode='"+req.body.LoanCode+"'",
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error");
          } else {
            console.log(result);
            res.send("success");
          }
        }
      );

     }
    }
  })
    
});

route.post("/Collectioncheck", (req, res) => {
  var date=getdate();
  var time=gettime();
  // console.log(date);
   database.RequestDatabase.query(
    "select * From dbo.CollectionLog where date='"+date+"' and agentid="+parseInt(req.body.id)+"",
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error");
      } else {
        if( result["recordset"].length!=0){
          res.send("Already Exist");
         }
          else{
              res.send("Not Exist");
          }
      }
    }
  );
  
});





module.exports = route;
